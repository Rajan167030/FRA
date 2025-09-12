import requests
import sys
import json
from datetime import datetime

class FRAConnectAPITester:
    def __init__(self, base_url="https://fra-connect.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_sample_data_initialization(self):
        """Initialize sample data"""
        print("\n🚀 Initializing sample data...")
        success, response = self.run_test(
            "Initialize Sample Data",
            "POST",
            "init-sample-data",
            200
        )
        return success

    def test_login(self, username="admin", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   Logged in as: {self.user_data.get('full_name', 'Unknown')} ({self.user_data.get('role', 'Unknown')})")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            expected_fields = ['total_villages', 'total_claims', 'pending_claims', 'approved_claims', 'disputed_claims']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
        return success

    def test_get_villages(self):
        """Test getting villages"""
        success, response = self.run_test(
            "Get Villages",
            "GET",
            "villages",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} villages")
            if len(response) > 0:
                village = response[0]
                expected_fields = ['id', 'name', 'state', 'district', 'coordinates']
                for field in expected_fields:
                    if field not in village:
                        print(f"   ⚠️  Missing field in village: {field}")
        return success, response

    def test_get_claims(self):
        """Test getting forest claims"""
        success, response = self.run_test(
            "Get Forest Claims",
            "GET",
            "claims",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} claims")
            if len(response) > 0:
                claim = response[0]
                expected_fields = ['id', 'claim_type', 'claim_number', 'village_id', 'beneficiary_name', 'status']
                for field in expected_fields:
                    if field not in claim:
                        print(f"   ⚠️  Missing field in claim: {field}")
        return success, response

    def test_get_specific_claim(self, claim_id):
        """Test getting a specific claim"""
        success, response = self.run_test(
            f"Get Specific Claim ({claim_id[:8]}...)",
            "GET",
            f"claims/{claim_id}",
            200
        )
        return success, response

    def test_update_claim_status(self, claim_id, new_status="under_review"):
        """Test updating claim status"""
        success, response = self.run_test(
            f"Update Claim Status to {new_status}",
            "PUT",
            f"claims/{claim_id}/status",
            200,
            data={
                "status": new_status,
                "notes": f"Status updated to {new_status} via API test"
            }
        )
        return success

    def test_filtered_claims(self):
        """Test getting claims with filters"""
        success, response = self.run_test(
            "Get Pending Claims",
            "GET",
            "claims?status=pending",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} pending claims")
        return success

    def test_villages_with_filters(self):
        """Test getting villages with state filter"""
        success, response = self.run_test(
            "Get Villages in Jharkhand",
            "GET",
            "villages?state=Jharkhand",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} villages in Jharkhand")
        return success

def main():
    print("🌲 FRA-Connect API Testing Suite")
    print("=" * 50)
    
    # Setup
    tester = FRAConnectAPITester()
    
    # Test sequence
    print("\n📋 Starting API Tests...")
    
    # 1. Initialize sample data
    if not tester.test_sample_data_initialization():
        print("⚠️  Sample data initialization failed, but continuing tests...")
    
    # 2. Test authentication
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    # 3. Test user info
    tester.test_get_current_user()
    
    # 4. Test dashboard
    tester.test_dashboard_stats()
    
    # 5. Test villages
    villages_success, villages_data = tester.test_get_villages()
    tester.test_villages_with_filters()
    
    # 6. Test claims
    claims_success, claims_data = tester.test_get_claims()
    tester.test_filtered_claims()
    
    # 7. Test specific claim operations
    if claims_success and claims_data and len(claims_data) > 0:
        test_claim = claims_data[0]
        claim_id = test_claim['id']
        
        # Test getting specific claim
        tester.test_get_specific_claim(claim_id)
        
        # Test updating claim status
        tester.test_update_claim_status(claim_id, "under_review")
        
        # Verify the update worked
        success, updated_claim = tester.test_get_specific_claim(claim_id)
        if success and updated_claim.get('status') == 'under_review':
            print("✅ Claim status update verified")
        else:
            print("❌ Claim status update verification failed")
    
    # Print final results
    print(f"\n📊 Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Trees, 
  Shield, 
  Users, 
  MapPin, 
  BarChart3, 
  FileText, 
  Bot, 
  Globe, 
  Award,
  CheckCircle,
  ArrowRight,
  Play,
  Download,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: MapPin,
      title: "Interactive Forest Atlas",
      description: "Comprehensive digital mapping of tribal villages and forest rights claims with real-time visualization.",
      color: "text-green-600"
    },
    {
      icon: Bot,
      title: "AI-Powered Decision Support",
      description: "Advanced machine learning algorithms assist officials in making informed decisions on forest rights applications.",
      color: "text-purple-600"
    },
    {
      icon: FileText,
      title: "Digital Case Management",
      description: "Streamlined processing of Individual and Community Forest Rights (IFR/CFR) applications with OCR technology.",
      color: "text-blue-600"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Analytics",
      description: "Real-time dashboards and reports for monitoring progress, performance metrics, and policy impact assessment.",
      color: "text-orange-600"
    },
    {
      icon: Users,
      title: "Multi-Stakeholder Platform",
      description: "Role-based access for administrators, field officers, verifiers, and community representatives.",
      color: "text-indigo-600"
    },
    {
      icon: Globe,
      title: "Government Scheme Integration",
      description: "Seamless integration with MGNREGA, PM-KISAN, and other welfare schemes for enhanced beneficiary support.",
      color: "text-teal-600"
    }
  ];

  const statistics = [
    { number: "10M+", label: "Tribal Population Covered", icon: Users },
    { number: "50K+", label: "Villages Mapped", icon: MapPin },
    { number: "2L+", label: "Claims Processed", icon: FileText },
    { number: "95%", label: "Processing Accuracy", icon: Award }
  ];

  const achievements = [
    "Digital India Initiative Certified",
    "Ministry of Tribal Affairs Approved",
    "ISO 27001 Security Compliant",
    "WCAG 2.1 AA Accessibility Standard",
    "Multi-Language Support (10+ Tribal Languages)",
    "99.9% System Uptime Guarantee"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-orange-500 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                <Trees className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">FRA-Connect</h1>
                <p className="text-sm text-slate-600">Forest Rights Atlas & Decision Support System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex text-right text-sm">
                <div>
                  <p className="text-slate-600">Government of India</p>
                  <p className="text-slate-500">Ministry of Tribal Affairs</p>
                </div>
              </div>
              <Link to="/login">
                <Button className="bg-blue-900 hover:bg-blue-800">
                  <Shield className="w-4 h-4 mr-2" />
                  Secure Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-orange-500 text-white mb-6 px-4 py-2">
              Digital India Initiative • Ministry of Tribal Affairs
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Empowering <span className="text-orange-400">Tribal Communities</span> Through Digital Forest Rights Management
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              A comprehensive AI-powered platform for implementing the Forest Rights Act (FRA) 2006, 
              ensuring transparent, efficient, and equitable recognition of tribal forest rights across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                  <Play className="w-5 h-5 mr-2" />
                  Access Portal
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3">
                <Download className="w-5 h-5 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">{stat.number}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Comprehensive Forest Rights Management Platform
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Built for the Ministry of Tribal Affairs to digitize and streamline the implementation 
              of the Forest Rights Act 2006, ensuring efficient processing and transparent governance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Government Compliance Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-blue-900 mb-6">
                Government Certified & Compliant Platform
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                FRA-Connect is built in accordance with Government of India's digital governance standards, 
                ensuring security, accessibility, and compliance with all regulatory requirements for 
                handling sensitive tribal community data.
              </p>
              
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-slate-700">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Shield className="w-10 h-10 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Secure & Encrypted</h3>
                      <p className="text-slate-600">End-to-end encryption with government-grade security protocols</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Globe className="w-10 h-10 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Multi-Language Support</h3>
                      <p className="text-slate-600">Interface available in 10+ tribal languages for inclusive access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Bot className="w-10 h-10 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900">AI-Powered Insights</h3>
                      <p className="text-slate-600">Machine learning algorithms for faster and accurate claim processing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Forest Rights Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of government officials, field officers, and community representatives 
            using FRA-Connect to implement transparent and efficient forest rights governance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/login">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 px-8 py-3">
                <Shield className="w-5 h-5 mr-2" />
                Access Secure Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3">
              <Phone className="w-5 h-5 mr-2" />
              Request Demo
            </Button>
          </div>
          
          <div className="text-center text-blue-200">
            <p className="mb-2">Demo Credentials for Testing:</p>
            <div className="inline-flex items-center space-x-4 bg-blue-800 px-6 py-3 rounded-lg">
              <span><strong>Username:</strong> admin</span>
              <span>•</span>
              <span><strong>Password:</strong> admin123</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Trees className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">FRA-Connect</h3>
                  <p className="text-slate-400 text-sm">Forest Rights Atlas & Decision Support System</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4 leading-relaxed">
                A Digital India initiative by the Ministry of Tribal Affairs, Government of India, 
                for transparent and efficient implementation of the Forest Rights Act 2006.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ministry Website
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Portal Login</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">User Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-3 text-slate-400">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>support@fra-connect.gov.in</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>1800-XXX-XXXX</span>
                </div>
                <div className="text-sm">
                  <p>Ministry of Tribal Affairs</p>
                  <p>Government of India</p>
                  <p>New Delhi - 110001</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p>© 2024 Government of India | Ministry of Tribal Affairs. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Accessibility</a>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Secured by NIC | Digital India Initiative | Made with ❤️ for Tribal Communities
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
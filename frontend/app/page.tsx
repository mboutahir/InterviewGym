import { Button } from "@/components/ui/button";
import { SignInButton, SignedOut } from "@clerk/nextjs"; 
import { auth } from "@clerk/nextjs/server"; // 👇 Import Auth
import { redirect } from "next/navigation";   // 👇 Import Redirect
import Link from "next/link";
import { Check, Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default async function LandingPage() {
  // 1. Check if user is already logged in
  const { userId } = await auth();

  // 2. If yes, skip the landing page and go straight to their jobs
  if (userId) {
    redirect("dashboard/jobs");
  }

  // 3. If no, show the Marketing Page
  return (
    <div className="min-h-screen bg-white">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <Sparkles className="text-blue-600" size={24} />
            TalentAgent
        </div>
        
        <div className="flex items-center gap-4">
            {/* Link for Candidates (Always visible) */}
            <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">
                For Candidates
            </Link>

            {/* Login for Recruiters */}
            <SignedOut>
                <SignInButton mode="modal">
                    <Button variant="ghost" className="text-gray-600">Log In</Button>
                </SignInButton>
            </SignedOut>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          Hire the <span className="text-blue-600">Top 1%</span> autonomously.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-10">
          The AI Recruiter that interviews, ranks, and shortlists candidates for you. 
          Stop watching videos. Start hiring.
        </p>
        
        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          
          {/* 1. Candidate Action */}
          <Link href="/jobs">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 h-auto border-2 border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all gap-2">
              <Search size={20} /> Find a Job
            </Button>
          </Link>

          {/* 2. Recruiter Action: "Start Free Trial" */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all">
                Start Free Trial
              </Button>
            </SignInButton>
          </SignedOut>

        </div>
      </header>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
                {/* Free Tier */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Starter</CardTitle>
                        <p className="text-3xl font-bold mt-2">$0 <span className="text-sm font-normal text-gray-500">/mo</span></p>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> 1 Active Job</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> 10 Candidates/mo</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Basic AI Analysis</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                         <SignInButton mode="modal">
                            <Button variant="outline" className="w-full">Sign Up Free</Button>
                        </SignInButton>
                    </CardFooter>
                </Card>

                {/* Pro Tier */}
                <Card className="border-2 border-blue-600 relative overflow-hidden shadow-xl">
                    <div className="bg-blue-600 text-white text-center text-xs py-1 font-bold">MOST POPULAR</div>
                    <CardHeader>
                        <CardTitle className="text-2xl">Growth</CardTitle>
                        <p className="text-3xl font-bold mt-2">$49 <span className="text-sm font-normal text-gray-500">/mo</span></p>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> 5 Active Jobs</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Unlimited Candidates</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Advanced AI Interviews</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <SignInButton mode="modal">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
                        </SignInButton>
                    </CardFooter>
                </Card>

                {/* Enterprise Tier */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Scale</CardTitle>
                        <p className="text-3xl font-bold mt-2">$199 <span className="text-sm font-normal text-gray-500">/mo</span></p>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Unlimited Jobs</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> API Access</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Dedicated Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Contact Sales</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </section>

    </div>
  );
}
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs"; 
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Users, Plus } from "lucide-react";
import CreateJobDialog from "@/components/ui/CreateJobDialog"; 

export default async function RecruiterJobsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const jobs = await db.job.findMany({
    where: { recruiter: { clerkId: userId } },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { candidates: true } } }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Recruiter Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl tracking-tight text-blue-600">
                TalentAgent
            </h1>
            <span className="text-gray-300">|</span>
            <span className="font-medium text-gray-600">Recruiter Hub</span>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Link to Analytics */}
            <Link href="/dashboard">
                <Button variant="ghost" className="gap-2 text-gray-500 hover:text-blue-600">
                    <BarChart3 size={18} /> Analytics
                </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Your Jobs</h2>
                <p className="text-gray-500 mt-1">Manage active listings and view applicants.</p>
            </div>
            
            <CreateJobDialog />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.length === 0 ? (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Plus size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No jobs posted yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
                        Create your first job posting to start gathering candidates with AI analysis.
                    </p>
                    <CreateJobDialog />
                 </div>
            ) : (
                jobs.map((job) => (
                    // Link to the SPECIFIC job management page
                    <Link href={`/dashboard/job/${job.id}`} key={job.id}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500 group h-full">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant={job.status === "OPEN" ? "default" : "secondary"} className="mb-2">
                                        {job.status}
                                    </Badge>
                                    <span className="text-xs font-mono text-gray-400">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {job.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                                    {job.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                                    <span className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                        <Users size={14} /> {job._count.candidates} Applicants
                                    </span>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))
            )}
        </div>
      </main>
    </div>
  );
}
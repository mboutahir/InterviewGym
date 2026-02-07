import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ArrowRight, Search, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function PublicJobBoard() {
  // 1. Fetch only OPEN jobs. No User Check needed.
  const jobs = await db.job.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: { recruiter: true }
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* Public Navbar */}
      <nav className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
        <Link href="/">
            <h1 className="font-bold text-xl tracking-tight text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                TalentAgent
            </h1>
        </Link>
        <div className="flex gap-4">
            <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-600">Recruiter Login</Button>
            </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="bg-white py-16 px-4 text-center border-b mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Find your next mission.
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Join the companies building the Agentic Economy. <br/>
            <span className="text-blue-600 font-medium">Fast-tracked by AI.</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-2 mb-6 text-gray-400 text-sm font-bold uppercase tracking-wider">
            <Search size={14} />
            <span>{jobs.length} Active Positions</span>
        </div>

        {/* Job Grid */}
        <div className="grid gap-5">
            {jobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No open positions right now.</p>
                </div>
            ) : (
                jobs.map((job) => (
                    <Link href={`/job/${job.id}`} key={job.id} className="group">
                        <Card className="hover:shadow-xl transition-all border border-gray-200 hover:border-blue-500/50 cursor-pointer overflow-hidden relative">
                            <CardContent className="p-6 sm:flex items-center justify-between">
                                
                                {/* Job Info */}
                                <div className="space-y-3 mb-4 sm:mb-0 relative z-10">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {job.title}
                                    </h3>
                                    
                                    <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                                        <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                                            {job.status}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                                            <MapPin size={14} />
                                            <span>Remote / Paris</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                                            <Clock size={14} />
                                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Call to Action Arrow */}
                                <div className="flex items-center gap-2 text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                    View Role <ArrowRight size={20} />
                                </div>

                            </CardContent>
                        </Card>
                    </Link>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
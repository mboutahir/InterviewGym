import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, Video, UserCheck, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-500">Real-time insights into your hiring funnel.</p>
         </div>
         <Link href="/dashboard/jobs">
            <Button variant="ghost">← Back to Jobs</Button>
         </Link>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12 Candidates</div>
                    <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Interviews</CardTitle>
                    <Video className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4 Completed</div>
                    <p className="text-xs text-muted-foreground">Avg score: 8.5/10</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Operational</div>
                    <p className="text-xs text-muted-foreground">FastAPI Agent Active</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Recent AI Video Screens</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Mock List */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                        C{i}
                                    </div>
                                    <div>
                                        <p className="font-medium">Candidate #{i}</p>
                                        <p className="text-xs text-gray-500">Python Developer Role</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Video size={14} /> Watch Replay
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Top Skills Detected</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {/* Mock Skills */}
                        <div className="flex justify-between text-sm"><span className="font-medium">FastAPI</span> <span className="text-gray-500">85%</span></div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-[85%]"></div></div>
                        
                        <div className="flex justify-between text-sm mt-4"><span className="font-medium">React / Next.js</span> <span className="text-gray-500">60%</span></div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-[60%]"></div></div>

                        <div className="flex justify-between text-sm mt-4"><span className="font-medium">Docker</span> <span className="text-gray-500">40%</span></div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-[40%]"></div></div>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
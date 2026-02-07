import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ApplyModal from "@/components/ui/ApplyModal";

//Context: In Next.js, when you name a folder [id], you are creating a Dynamic Route.

interface JobPageProps {
    // const params = await props.params is just your code waiting that split second to open the package and read the ID 123 so it knows which job to show the candidate.
    params: Promise<{id: string}>;
    
}
export default async function PublicJobPage(props: JobPageProps){

    const params = await props.params;
    const job = await db.job.findUnique({
        where : { id: params.id },
        include: { recruiter: true }// We include recruiter to show who posted it
    });
    if(!job)
        return notFound();
   return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      
      {/* Back Button */}
      <div className="w-full max-w-3xl mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
            <Badge variant="outline" className="bg-white px-4 py-1 border-gray-300">
                {job.status}
            </Badge>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                {job.title}
            </h1>
            <p className="text-lg text-gray-600">
                Posted {new Date(job.createdAt).toLocaleDateString()}
            </p>
        </div>

        {/* The Job Card */}
        <Card className="shadow-xl border-t-4 border-t-blue-600">
            <CardContent className="p-8 space-y-8">
                
                {/* Description */}
                <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">About the Role</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                        {job.description}
                    </p>
                </section>

                {/* Requirements */}
                <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">Requirements</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {job.requirements}
                    </p>
                </section>

                {/* 👇 THIS IS THE CHANGE: The Real Apply Modal */}
                <div className="pt-8 flex justify-center">
                    <ApplyModal jobId={job.id} jobTitle={job.title} />
                </div>

            </CardContent>
        </Card>
      </div>
    </div>
  );
}



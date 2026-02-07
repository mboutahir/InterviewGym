import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

interface pageProps{
    params: Promise<{ id: string }>;
}

export default async function JobManage(props: pageProps){
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const params = await props.params;
    const job = await db.job.findFirst({
        where: { 
            recruiter: {clerkId: userId},
            id: params.id,
         },
         include: {
             candidates: {
                orderBy:[
                    { rating: 'desc' },
                    { createdAt: 'desc' }
                ]
             }
         }

    });
    if (!job) return notFound();
    return (
    <Table>
    <TableHeader>
        <TableRow>
            {/* 1. Score Header */}
            <TableHead className="w-[100px]">Score</TableHead> 
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {job.candidates.map((candidate) => (
            <TableRow key={candidate.id}>
                
                {/* 2. Score Badge */}
                <TableCell>
                    <div className={`font-bold text-lg ${
                        candidate.rating >= 80 ? "text-green-600" :
                        candidate.rating >= 50 ? "text-yellow-600" : "text-gray-400"
                    }`}>
                        {candidate.rating}%
                    </div>
                </TableCell>

                {/* 3. Name (Corrected to use firstName + lastName) */}
                <TableCell className="font-medium flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <User size={16} />
                    </div>
                    <span>
                        {candidate.firstName} {candidate.lastName}
                    </span>
                </TableCell>

                <TableCell>{candidate.email}</TableCell>
                <TableCell>{new Date(candidate.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant="outline">{candidate.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <span className="text-blue-600 cursor-pointer text-sm font-semibold hover:underline">
                        View Resume
                    </span>
                </TableCell>
            </TableRow>
        ))}
    </TableBody>
</Table>
    )
}
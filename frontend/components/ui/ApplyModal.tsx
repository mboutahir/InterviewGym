'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, UploadCloud, Loader2, User, Mail } from "lucide-react";

export default function ApplyModal({ jobId, jobTitle }: { jobId: string, jobTitle: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [score, setScore] = useState(0);

    // Track the filename to show it after selection
    const [fileName, setFileName] = useState<string | null>(null);

    async function handleFileUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        // Add Job ID manually
        formData.append("job_id", jobId);

        try {
            const response = await fetch("http://localhost:8000/analyze_resume", {
                method: "POST",
                body: formData, 
            });

            const data = await response.json();

            if (response.ok) {
                setScore(data.rating);
                setSuccess(true);
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                    setFileName(null); // Reset form
                }, 3000);
            } else {
                alert("Error: " + data.detail);
            }

        } catch (error) {
            console.error(error);
            alert("Failed to connect to the AI server.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 shadow-lg transition-all">
                    Apply Now
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px]">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-green-600 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={64} />
                        <h3 className="text-2xl font-bold">Application Sent!</h3>
                        
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Apply for {jobTitle}</DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleFileUpload} className="space-y-4 mt-2">
                            
                            {/* 1. First Name & Last Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input id="first_name" name="first_name" placeholder="John" className="pl-9" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input id="last_name" name="last_name" placeholder="Doe" required />
                                </div>
                            </div>

                            {/* 2. Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input id="email" name="email" type="email" placeholder="john@example.com" className="pl-9" required />
                                </div>
                            </div>

                            {/* 3. Resume Upload */}
                            <div className="space-y-2">
                                <Label>Resume (PDF)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group relative">
                                    <Input 
                                        id="resume-upload" 
                                        name="file" 
                                        type="file" 
                                        accept=".pdf" 
                                        required 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFileName(e.target.files[0].name);
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <UploadCloud size={24} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                                            {fileName ? fileName : "Click to upload Resume"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 h-12 text-lg mt-2">
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" /> Analyzing...
                                    </span>
                                ) : (
                                    "Submit Application"
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
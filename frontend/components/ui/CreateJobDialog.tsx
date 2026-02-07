'use client'

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2 } from "lucide-react";
import { createJob } from "@/app/actions/createJob";

export default function CreateJobDialog() {
    const [open, setOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        const result = await createJob(formData);
        setIsLoading(false);

        if (result.success) {
            setShowSuccess(true);
            setOpen(false);
        } else {
            console.error(result.message);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 text-white shadow-md">
                        <Plus size={18} /> Create New Job
                    </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create a Job Post</DialogTitle>
                    </DialogHeader>

                    <form action={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <Label>Job Title</Label>
                            <Input name="title" required placeholder="e.g. React Developer" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea name="description" required placeholder="Job details..." />
                        </div>
                        <div>
                            <Label>Requirements</Label>
                            <Textarea name="requirements" required placeholder="Skills..." />
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white">
                            {isLoading ? "Posting..." : "Post Job"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className={`
                fixed bottom-16 left-1/2 transform -translate-x-1/2 
                flex items-center gap-3 px-8 py-4 rounded-lg
                bg-green-500/15 border border-green-500/40 backdrop-blur-md
                text-green-700 font-semibold text-lg
                transition-all duration-700 ease-in-out z-50
                ${showSuccess ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"}
            `}>
                <CheckCircle2 size={24} className="text-green-600 flex-shrink-0" />
                <span>Job Posted Successfully! 🎉</span>
            </div>
        </>
    );
}
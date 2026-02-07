'use server'

import { success, z } from 'zod'; //library for validating data It ensures users dont submit empty titles or 1 letter descriptions.

import { db } from '@/lib/db';

import { auth, currentUser } from '@clerk/nextjs/server'; //The Clerk helper that tells us who is making the request.
import { revalidatePath } from 'next/cache'; //command to clear the Next.js cache


//blueprint: we define what a valid job looks like before we even look at the data.
const jobSchema = z.object({
    title: z.string().min(2, "Title is too short"),
    description: z.string().min(10, "Description is too short"),
    requirements: z.string().min(2, "Please list at least one requirement"),
});
//formData: This is the standard Web API object. When you submit a <form>, the browser packages all the inputs into this FormData object.
export async function createJob(formData: FormData) {
    //we use curly braces on this variable so we "I know auth() returns a big object. I don't want the whole box. Just reach inside and pull out the variable named userId directly."
    const { userId } = await auth();
    //fetch current user from clerk
    const user = await currentUser();
    if (!userId || !user) {
        throw new Error("You must be logged in to post a job.");
    }
    if (!userId) {
        throw new Error("You must be logged in to post a job.");
    }
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const requirements = formData.get('requirements') as string;

    //checks if the text exists and isn't empty.
    const parsed = jobSchema.safeParse({
        title,
        description,
        requirements,

    });
    if (!parsed.success) {
        return { success: false, message: "Invalid input" };
    }
    const requirementsArray = parsed.data.requirements
        .split(',')
        .map(req => req.trim())
        .filter(req => req.length > 0)
    try {
        //Update + Insert
        //This is making sure the Recruiter exist in the database.
        //if user exist we go to update block if not we go to create block
        await db.recruiter.upsert({
            //const { userId } = await auth();
            where: { clerkId: userId },
            update: {},
            create: {
                clerkId: userId,
                email: user.emailAddresses[0].emailAddress,
            }
        });
        await db.job.create({
            data: {
                title: parsed.data.title,
                description: parsed.data.description,
                requirements: requirementsArray,
                status: "OPEN",
                //This job belongs to the user whose clerkId matches this specific ID
                recruiter: {
                    connect: { clerkId: userId }
                }
            },
        });
        //refresh button for  server.
        revalidatePath("/jobs");
        return { success: true, message: "Job posted successfully!" };
    }
    catch (error) {
        console.error("Failed to create job:", error);
        return { success: false, message: "Database Error" };
    }


}



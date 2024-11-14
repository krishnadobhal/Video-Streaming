"use server"

import { db } from "@/Server"

export default async function getpost(prevState: any,formdata:FormData) {
    const posts=await db.query.users.findMany();
    return {message:true};
}

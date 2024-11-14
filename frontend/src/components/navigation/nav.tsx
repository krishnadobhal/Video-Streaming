"use server "
import { auth } from "@/Server/auth";
import Link from 'next/link';
import {UserButton} from "./user-button";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";


async function Nav() {
    const Session = await auth();
    console.log("id->",Session?.user?.id);
    

        return (
            <nav>
                <ul className="flex gap-4 items-center justify-between"> 
                    <li><Link href="/">Home</Link></li>
                    {!Session ? (
                        <li>
                            <Button asChild> 
                                <Link href={"/auth/login"} className="flex gap-1">
                                    <LogIn size={16 }/>
                                    <span>Login</span>
                                </Link>
                            </Button>
                        </li>
                    ):(
                        <li><UserButton expires={Session?.expires} user={Session?.user}/></li>
                    )}
                </ul>
            </nav>
        );
    } 


export default Nav;
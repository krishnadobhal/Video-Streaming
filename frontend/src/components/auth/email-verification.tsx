"use client"
import { emailVerification } from "@/Server/actions/token"
import { useSearchParams,useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { FormSuccess } from "./form-success"
import { FormError } from "./form-error"


export default function EmailVerification(){
  const token = useSearchParams().get("token")
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleVerification = useCallback(() => {
    if (success || error) return
    if (!token) {
      setError("No token found")
      return
    }
    emailVerification(token).then((data) => {
      if (data.error) {
        setError(data.error)
      }
      if (data.success) {
        setSuccess(data.success)
        router.push("/auth/login")
      }
    })
  }, [])

  useEffect(() => {
    handleVerification()
  }, [])
  return(
    <div>
        <FormSuccess message={success}/>
        <FormError message={error}/>
    </div>
  )
}
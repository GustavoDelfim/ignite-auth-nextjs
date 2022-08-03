import { useContext, useEffect } from "react"
import { AuthContext } from "../context/AuthContext"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard () {
  const {user} = useContext(AuthContext)

  useEffect(() => {
    api.get('me').then(res => console.log(res))
  }, [])
  
  return (
    <h1>Dashboard: {user?.email}</h1>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const api = setupAPIClient(ctx)
  const {data} = await api.get('/me')

  return {
    props: {}
  }
})
import { useEffect, useState } from "react";
import API from "../services/api";

export default function Leaderboard() {

  const [leaders, setLeaders] = useState([]);

  useEffect(() => {

    API.get("/projects/leaderboard")
      .then(res => setLeaders(res.data))

  }, []);

  return (

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Top Innovators
      </h1>

      {leaders.map(user => (

        <div key={user.id} className="border p-3 mb-2">

          {user.name} — {user.total_likes} likes

        </div>

      ))}

    </div>

  )

}
export default function Home() {
  return <>
    <h1>THis is a landing page</h1>
    <p>24Hour AI is a platform that provides affordable AI services to individuals and businesses.</p>

    I want to finish making the client endpoints for the AI chatbot
    I want to finish the backend first and then add the frontend
    I want to use SQLite for the database, but only if it has vector store. If not, I want to use Supabase with PGVector. 



    <ul>
      <li>
        <label>
          <input type="radio" name="task" value="client-endpoints" />
          Finish making the client endpoints for the AI chatbot
        </label>
      </li>
      <li>
        <label>
          <input type="radio" name="task" value="backend" />
          Finish the backend first and then add the frontend
        </label>
      </li>
      <li>
        <label>
          <input type="radio" name="task" value="database" />
          Use SQLite for the database, but only if it has vector store. If not, use Supabase with PGVector
        </label>
      </li>
    </ul>
  </>;
}

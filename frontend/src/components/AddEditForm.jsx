
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function AddEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const API_URL = "https://mern-crud-app-main-0jck.onrender.com/api/v1/posts";

  useEffect(() => {
    if (id) {
      async function fetchPost() {
        try {
          const response = await fetch(`${API_URL}/${id}`);

          if (!response.ok) {
            throw new Error("Failed to fetch post");
          }

          const result = await response.json();
          setTitle(result.data.title);
          setContent(result.data.content);
        } catch (error) {
          console.error("Error fetching post:", error);
          alert("Could not load post.");
        }
      }

      fetchPost();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      alert(id ? "Post updated successfully!" : "Post created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error submitting post:", error);
      alert("Failed to save post. Check backend connection.");
    }
  };

  return (
    <>
      <div>{id ? "Edit Form" : "Add Form"}</div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <br />

        <button type="submit">
          {id ? "Update" : "Add"}
        </button>
      </form>
    </>
  );
}

export default AddEditForm;

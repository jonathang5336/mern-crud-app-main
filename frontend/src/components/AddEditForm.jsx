import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function AddEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (id) {
      async function fetchPost() {
        const response = await fetch(`https://badri-crud-backend.onrender.com/api/v1/posts/${id}`);
        const data = await response.json();
        setTitle(data.data.title);
        setContent(data.data.content);
      }
      fetchPost();
    }
  }, [id]);


const handleSubmit = async (e) => {
  e.preventDefault();

  const method = id ? "PUT" : "POST";
  const url = id
    ? `https://mern-crud-app-main-0jck.onrender.com/api/v1/posts/${id}`
    : "https://mern-crud-app-main-0jck.onrender.com/api/v1/posts";

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

    navigate("/");
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
          onChange={(e) => setContent(e.target.value)}></textarea>
        <br />
        <button type="submit">{id ? "Update" : "Add"}</button>
      </form>
    </>
  );
}

export default AddEditForm;

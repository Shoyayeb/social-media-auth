import axios from 'axios';
import React from "react";
import './App.css';

function App() {
  const [postText, setPostText] = React.useState();
  const token = 'token';
  const handlePost = (e) => {
    e.preventDefault();
    console.log(postText);
    if (postText) axios.post('http://localhost:4000/submitpost', { postText }, { headers: { "Authorization": `Bearer ${token}` } }).then(res => {
      console.log(res.data);
    });
  };



  return (
    <div className="App">
      <header className="App-header">
        <p>Enter Post</p>
        <form onSubmit={handlePost}>

          <textarea onChange={(e) => setPostText(e.target.value)} name="post" id="post" cols="30" rows="8"></textarea>
          <button type='submit'>Post</button>
        </form>
      </header>
    </div>
  );
}

export default App;
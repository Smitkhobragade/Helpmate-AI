import { useState, useEffect } from "react";
import "./App.css"; // Updated App.css with new styling below
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Footer from "./Footer";
import ShareButtons from "./components/ShareButtons";
import { FaMicrophone, FaPaperPlane, FaVolumeUp } from "react-icons/fa";

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const toggleSpeaking = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  async function generateAnswer(e) {
    e.preventDefault();
    setGeneratingAnswer(true);
    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${
          import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT
        }`,
        method: "post",
        data: {
          contents: [{ parts: [{ text: question }] }],
        },
      });

      const fullAnswer = response.data.candidates[0].content.parts[0].text;

      setChatHistory((prevChat) => [
        ...prevChat,
        { type: "question", text: question },
        { type: "answer", text: fullAnswer },
      ]);

      setQuestion(""); // Clear question input after submitting
    } catch (error) {
      console.error(error);
      setChatHistory((prevChat) => [
        ...prevChat,
        { type: "answer", text: "Sorry, something went wrong. Please try again!" },
      ]);
    } finally {
      setGeneratingAnswer(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white">
        <h1 className="text-5xl font-bold text-blue-400 mt-10 mb-2 text-center">Helpmate AI</h1>
        <p className="text-md text-gray-400 text-center mb-10">Your AI assistant at your fingertips</p>
      <div className="flex-grow p-6 overflow-auto"> {/* Enable scrolling for the outermost container */}
        <div className="chat-box max-w-3xl mx-auto bg-gray-900 rounded-lg shadow-lg p-4 mt-10">
        <p className="text-lg text-gray-400 text-left ">How may I help you ?</p>
          <div className="chat-display space-y-4 mb-4">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  chat.type === "question"
                    ? "bg-blue-500 text-white self-end text-right w-fit max-w-[80%] ml-auto"
                    : "bg-gray-700 text-white self-start text-left w-fit max-w-[80%] ml-4 overflow-x-scroll"
                }`}
              >
                <ReactMarkdown>{chat.text}</ReactMarkdown>
                {chat.type === "answer" && (
                  <div className="flex justify-end mt-2 space-x-2">
                    <button onClick={() => toggleSpeaking(chat.text)} className="flex items-center text-white mt-2 mr-2">
                      <FaVolumeUp className="mr-1"/>
                      Speak
                    </button>
                    <ShareButtons answer={chat.text} />
                  </div>
                )}
              </div>
            ))}
            {generatingAnswer && (
              <div className="p-4 rounded-lg bg-gray-700 animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={generateAnswer} className="flex items-center w-full bg-gray-800 p-3 rounded-lg shadow-md">
            <textarea
              required
              className="border border-gray-700 bg-gray-800 text-white rounded-lg w-full p-2 h-12 resize-none focus:border-blue-500 outline-none"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your AI mate..."
            />
            <div className="flex items-center space-x-2 ml-4">
              {recognition && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-transform duration-300 ease-in-out ${
                    isListening ? "bg-red-500 flicker" : "bg-blue-500"
                  } hover:opacity-80`}
                >
                  <FaMicrophone className="text-white" />
                </button>
              )}
              <button
                type="submit"
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-700"
                disabled={generatingAnswer}
              >
                <FaPaperPlane className={`text-white ${generatingAnswer ? "send-animation" : ""}`} />
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;

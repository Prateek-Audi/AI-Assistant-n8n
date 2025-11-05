import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Copy, Check, Loader2, Sparkles, Trash2, StopCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const webhookUrl = "https://prateek-audi.app.n8n.cloud/webhook/chat";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: messageText,
          message: messageText
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const textContent = await response.text();
      
      if (!textContent || textContent.trim() === '') {
        throw new Error('Received empty response from AI');
      }

      let data;
      try {
        data = JSON.parse(textContent);
      } catch (jsonError) {
        throw new Error('Invalid response format from AI');
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.output || data.text || "No response received",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      
      // Check if the request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        const stoppedMessage: Message = {
          role: 'assistant',
          content: '⏹️ Response stopped by user.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, stoppedMessage]);
        toast.info("Response stopped");
        return;
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error("Failed to get response", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Chat cleared!");
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const suggestedPrompts = [
    "What can you help me with?",
    "Tell me a joke",
    "Explain quantum computing",
    "Write a haiku about AI"
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 h-screen flex flex-col">
      {/* Header */}
      <div className="text-center py-6 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          <h1 className="text-slate-900">AI Chat Assistant</h1>
        </div>
        <p className="text-slate-600">
          Powered by Google Gemini via n8n
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-2 border-slate-200">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="text-6xl">👋</div>
                <h2 className="text-slate-700">Welcome! How can I help you today?</h2>
                <p className="text-sm text-slate-500">
                  Ask me anything - I'm here to assist you!
                </p>
                
                {/* Suggested Prompts */}
                <div className="space-y-3 pt-4">
                  <p className="text-xs text-slate-500">Try asking:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="text-xs h-auto py-2 hover:bg-indigo-50 hover:border-indigo-300"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg'
                        : message.content.startsWith('❌')
                        ? 'bg-red-50 text-red-900 border-2 border-red-200'
                        : message.content.startsWith('⏹️')
                        ? 'bg-orange-50 text-orange-900 border-2 border-orange-200'
                        : 'bg-white border-2 border-slate-200 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs opacity-70 mb-1 flex items-center gap-1">
                          {message.role === 'user' ? (
                            <>
                              <span>👤</span>
                              <span>You</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>AI Assistant</span>
                            </>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      {message.role === 'assistant' && !message.content.startsWith('❌') && !message.content.startsWith('⏹️') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0 hover:bg-slate-100"
                          onClick={() => handleCopy(message.content, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-sm text-slate-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-slate-200 bg-white p-4">
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading}
              className="flex-1 h-12 text-base border-2 focus:border-indigo-400"
            />
            {isLoading ? (
              <Button 
                onClick={handleStopGeneration} 
                size="lg"
                variant="destructive"
                className="h-12 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Stop
              </Button>
            ) : (
              <Button 
                onClick={handleSend} 
                disabled={!input.trim()}
                size="lg"
                className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {messages.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                disabled={isLoading}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Chat
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 mt-4 pb-2">
        Powered by Google Gemini AI • Built with n8n
      </div>
    </div>
  );
}

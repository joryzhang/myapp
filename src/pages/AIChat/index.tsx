import { chatStream } from '@/services/rag';
import {
  CaretRightOutlined,
  LoadingOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Collapse,
  Input,
  message,
  Slider,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// Custom Styles using antd-style
const useStyles = createStyles(({ token }) => {
  return {
    mainContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      backgroundColor: '#ffffff',
      position: 'relative',
    },
    chatArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 0 100px 0',
      scrollBehavior: 'smooth',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Center content horizontally
    },
    messageRow: {
      width: '100%',
      maxWidth: '800px',
      padding: '0 16px',
      '@media (min-width: 768px)': {
        padding: '0 24px',
      },
      display: 'flex',
      marginBottom: '32px',
      gap: '16px',
    },
    userMessageRow: {
      justifyContent: 'flex-end',
    },
    aiMessageRow: {
      justifyContent: 'flex-start',
    },
    avatar: {
      flexShrink: 0,
      marginTop: '2px', // Align with top of text
    },
    messageBubble: {
      padding: '12px 16px',
      borderRadius: '12px',
      maxWidth: '100%',
      wordBreak: 'break-word',
      fontSize: '15px',
      lineHeight: '1.6',
    },
    userBubble: {
      backgroundColor: token.colorPrimary,
      color: '#fff',
      borderRadius: '12px 12px 2px 12px',
    },
    aiBubble: {
      backgroundColor: '#f1f5f9', // Slate-100
      color: '#1e293b',
      borderRadius: '12px 12px 12px 2px',
      border: '1px solid #e2e8f0',
    },
    inputContainer: {
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '800px',
      padding: '0 16px',
      zIndex: 10,
      '@media (min-width: 768px)': {
        padding: '0 24px',
      },
    },
    inputWrapper: {
      position: 'relative',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      padding: '12px',
      transition: 'box-shadow 0.2s',
      '&:focus-within': {
        boxShadow: '0 8px 16px rgba(37, 99, 235, 0.1)',
        borderColor: token.colorPrimary,
      },
    },
    thinkingContainer: {
      marginBottom: '12px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    thinkingHeader: {
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#64748b',
      userSelect: 'none',
      '&:hover': {
        color: token.colorPrimary,
      },
    },
    thinkingBody: {
      padding: '12px',
      borderTop: '1px solid #e2e8f0',
      fontSize: '13px',
      color: '#475569',
      fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, whitespace, monospace',
      whiteSpace: 'pre-wrap',
      backgroundColor: '#fff',
    },
    markdown: {
      '& p': { marginBottom: '1em' },
      '& p:last-child': { marginBottom: 0 },
      '& pre': {
        backgroundColor: '#1e293b',
        color: '#e2e8f0',
        padding: '12px',
        borderRadius: '6px',
        overflowX: 'auto',
      },
      '& code': {
        backgroundColor: 'rgba(0,0,0,0.06)',
        padding: '2px 4px',
        borderRadius: '4px',
        fontSize: '0.9em',
      },
    },
  };
});

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string; // 思考过程
}

const AIChat: React.FC = () => {
  const { styles } = useStyles();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [temperature, setTemperature] = useState(0.7);

  // 流式状态
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingThinking, setStreamingThinking] = useState('');
  const [isThinking, setIsThinking] = useState(false); // 当前是否正在接收思考流

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, streamingThinking]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const currentQuestion = inputValue;
    setInputValue('');
    setLoading(true);

    // Reset streaming states
    setStreamingContent('');
    setStreamingThinking('');
    setIsThinking(false);

    // Add user message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentQuestion,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    try {
      // 构建对话历史 (排除当前这条, 只取已完成的对话)
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      const response = await chatStream(currentQuestion, history, temperature);

      if (!response.body) {
        message.error('流式响应异常');
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Temporary buffers for the incoming stream
      let currentThink = '';
      let currentText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') break;

            try {
              const data = JSON.parse(jsonStr);

              // Handle Thinking
              const thinkChunk = data.reasoning_content || data.thinking;
              if (thinkChunk) {
                setIsThinking(true);
                currentThink += thinkChunk;
                setStreamingThinking((prev) => prev + thinkChunk);
              }

              // Handle Content
              if (data.content) {
                setIsThinking(false); // Switch to content mode
                currentText += data.content;
                setStreamingContent((prev) => prev + data.content);
              }
            } catch (e) {
              console.error('JSON Parse Error', e);
            }
          }
        }
      }

      // Finished
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: currentText,
        thinking: currentThink,
      };
      setMessages((prev) => [...prev, newAiMsg]);

      // Clear stream display
      setStreamingContent('');
      setStreamingThinking('');
    } catch (error) {
      console.error(error);
      message.error('发送请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render Logic for "Thinking" Block
  const renderThinking = (thinkingText: string, isStreaming: boolean = false) => {
    if (!thinkingText) return null;

    // Default expanded if streaming, collapsed if done
    return (
      <div className={styles.thinkingContainer}>
        <Collapse
          ghost
          size="small"
          defaultActiveKey={isStreaming ? ['1'] : []}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: '12px' }} />
          )}
        >
          <Panel
            header={
              <Space>
                <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                <span>Deep Reasoning Process</span>
                {isStreaming && isThinking && (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
                )}
              </Space>
            }
            key="1"
            className={styles.thinkingHeader}
          >
            <div className={styles.thinkingBody}>{thinkingText}</div>
          </Panel>
        </Collapse>
      </div>
    );
  };

  return (
    <div className={styles.mainContainer}>
      {/* Chat Area */}
      <div className={styles.chatArea}>
        {/* Welcome Placeholder */}
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '15vh', opacity: 0.5, padding: '0 16px' }}>
            <RobotOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#94a3b8' }}>
              How can I help you today?
            </Title>
          </div>
        )}

        {/* History Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${
              msg.role === 'user' ? styles.userMessageRow : styles.aiMessageRow
            }`}
          >
            {/* Avatar for AI */}
            {msg.role === 'assistant' && (
              <Avatar
                icon={<RobotOutlined />}
                className={styles.avatar}
                style={{ backgroundColor: '#2563EB' }} // Royal Blue
              />
            )}

            <div style={{ maxWidth: '100%' }}>
              {/* Render Thinking if exists */}
              {msg.role === 'assistant' && msg.thinking && renderThinking(msg.thinking)}

              {/* Message Bubble */}
              <div
                className={`${styles.messageBubble} ${
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble
                }`}
              >
                {msg.role === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                ) : (
                  <div className={styles.markdown}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar for User */}
            {msg.role === 'user' && (
              <Avatar
                icon={<UserOutlined />}
                className={styles.avatar}
                style={{ backgroundColor: '#0f172a' }} // Slate-900
              />
            )}
          </div>
        ))}

        {/* Streaming Message (Current) */}
        {loading && (streamingContent || streamingThinking) && (
          <div className={`${styles.messageRow} ${styles.aiMessageRow}`}>
            <Avatar
              icon={<RobotOutlined />}
              className={styles.avatar}
              style={{ backgroundColor: '#2563EB' }}
            />
            <div style={{ maxWidth: '100%' }}>
              {renderThinking(streamingThinking, true)}
              {streamingContent && (
                <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                  <div className={styles.markdown}>
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '15px',
                      backgroundColor: '#2563EB',
                      marginLeft: '4px',
                      animation: 'blink 1s infinite',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <TextArea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message to AI..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            bordered={false}
            disabled={loading}
            style={{ resize: 'none', padding: '0', fontSize: '15px' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              gap: '16px',
            }}
          >
            <Tooltip title={`温度: ${temperature} (0=精确, 1=创造性, RAG自动为0)`}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  maxWidth: '200px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>🌡️</span>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={temperature}
                  onChange={setTemperature}
                  style={{ flex: 1, margin: 0 }}
                  tooltip={{ formatter: (v) => `${v}` }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', minWidth: '24px' }}>
                  {temperature}
                </span>
              </div>
            </Tooltip>
            <Button
              type="primary"
              shape="circle"
              icon={
                loading ? (
                  <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 18, color: '#fff' }} spin />}
                  />
                ) : (
                  <SendOutlined />
                )
              }
              onClick={handleSend}
              disabled={!inputValue.trim() && !loading}
            />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            AI can make mistakes. Please verify important information.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

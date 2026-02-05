import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Upload, message, Button, Space, Typography, Alert, Steps, Result } from 'antd';
import { InboxOutlined, CheckCircleFilled, CloudUploadOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { createStyles } from 'antd-style';
import { uploadPDF, healthCheck } from '@/services/rag';

const { Dragger } = Upload;
const { Text, Title, Paragraph } = Typography;

const useStyles = createStyles(({ token }) => {
    return {
        container: {
            maxWidth: '1000px',
            margin: '0 auto',
        },
        draggerCard: {
            borderRadius: '16px',
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            '.ant-upload-drag': {
                border: `2px dashed ${token.colorPrimary}`,
                borderRadius: '12px',
                backgroundColor: token.colorBgLayout,
                transition: 'all 0.3s',
                '&:hover': {
                    borderColor: token.colorPrimaryActive,
                    backgroundColor: token.colorPrimaryBg,
                }
            }
        },
        iconWrapper: {
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: token.colorPrimaryBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
        },
        icon: {
            fontSize: '32px',
            color: token.colorPrimary,
        },
        fileItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: '8px',
            marginBottom: '8px',
        }
    };
});

/**
 * 管理员 - PDF 上传解析页面
 */
const AdminUpload: React.FC = () => {
    const { styles, theme } = useStyles();
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    // 自定义上传逻辑
    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const response = await uploadPDF(file);

            if (response && response.code === 0) {
                message.success(`${file.name} 上传并解析成功!`);
                setUploadedFiles([...uploadedFiles, file.name]);
                return true;
            } else {
                message.error('上传失败');
                return false;
            }
        } catch (error) {
            message.error('上传失败,请稍后重试');
            console.error('上传错误:', error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.pdf',
        beforeUpload: (file) => {
            const isLt50M = file.size / 1024 / 1024 < 50;
            if (!isLt50M) {
                message.error('文件大小不能超过 50MB!');
                return false;
            }

            const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
            if (!isPDF) {
                message.error('只能上传 PDF 文件!');
                return false;
            }

            handleUpload(file);
            return false;
        },
        showUploadList: false,
    };

    const checkService = async () => {
        try {
            await healthCheck();
            message.success('RAG 服务运行正常 - 连接成功');
        } catch (error) {
            message.error('无法连接到 RAG 服务，请检查后端状态');
        }
    };

    return (
        <PageContainer
            header={{
                title: '知识库文档管理',
                subTitle: 'Upload and parse PDF documents for the AI Knowledge Base',
                ghost: true,
            }}
        >
            <div className={styles.container}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>

                    {/* Status / Instructions */}
                    <Card bordered={false} style={{ borderRadius: '16px', background: 'transparent', padding: 0 }} bodyStyle={{ padding: 0 }}>
                        <Alert
                            message={
                                <Space align="center">
                                    <CheckCircleFilled style={{ color: theme.colorSuccess }} />
                                    <Text strong>System Ready</Text>
                                </Space>
                            }
                            description="支持 PDF 格式 (Max 50MB)。文档上传后将自动进行 OCR 解析和向量化处理。"
                            type="success"
                            action={
                                <Button size="small" type="text" onClick={checkService} icon={<CloudUploadOutlined />}>
                                    服务状态检查
                                </Button>
                            }
                            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        />
                    </Card>

                    {/* Main Upload Area */}
                    <Card className={styles.draggerCard} title="上传新文档" bordered={false}>
                        <Dragger {...uploadProps} disabled={uploading}>
                            <div style={{ padding: '48px 0' }}>
                                <div className={styles.iconWrapper}>
                                    <InboxOutlined className={styles.icon} />
                                </div>
                                <Title level={4} style={{ marginBottom: 8 }}>
                                    {uploading ? 'Processing Document...' : '点击或拖拽上传 PDF'}
                                </Title>
                                <Text type="secondary" style={{ fontSize: '14px' }}>
                                    {uploading ? '正在进行智能文本提取和向量存储，请勿关闭页面' : 'Designed for high-accuracy parsing'}
                                </Text>
                            </div>
                        </Dragger>
                    </Card>

                    {/* Recent Uploads */}
                    {uploadedFiles.length > 0 && (
                        <Card title="本次会话上传记录" bordered={false} style={{ borderRadius: '16px' }}>
                            {uploadedFiles.map((filename, index) => (
                                <div key={index} className={styles.fileItem}>
                                    <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f', marginRight: '16px' }} />
                                    <div style={{ flex: 1 }}>
                                        <Text strong>{filename}</Text>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Processed & Indexed</div>
                                    </div>
                                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: '20px' }} />
                                </div>
                            ))}
                        </Card>
                    )}
                </Space>
            </div>
        </PageContainer>
    );
};

export default AdminUpload;

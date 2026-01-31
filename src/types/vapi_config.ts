// Conajra Solutions © 2026
// Author: Marwan
//
// type definitions for vapi assistant config
// read more on the config struct here: https://docs.vapi.ai/api-reference/assistants/create

// Message type for model configuration
export interface vapi_mdl_message 
{
    content: string;
    role: "assistant" | "user" | "system" | "tool" | "function";
}

// tool configuration
export interface vapi_tool 
{
    type: "apiRequest" | "function" | "ghl" | "make";
    name?: string;
    description?: string;
    url?: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, unknown>;
    body?: Record<string, unknown>;
    timeoutSeconds?: number;
    messages?: unknown[];
    async?: boolean;
    [key: string]: unknown;  // Allow additional properties for flexibility
}

// Transcriber configuration
export interface vapi_transcriber 
{
    provider: "deepgram" | "assembly-ai" | "talkscriber" | "gladia";
    model?: string;
    language?: string;
    confidenceThreshold?: number;
    keywords?: string[];
    endpointing?: number;
    [key: string]: unknown;  // Allow additional properties
}

// Voice configuration
export interface vapi_voice 
{
    provider: "11labs" | "playht" | "rime-ai" | "deepgram" | "openai" | "azure" | "lmnt" | "cartesia";
    voiceId: string;
    speed?: number;
    stability?: number;
    similarityBoost?: number;
    optimizeStreamingLatency?: number;
    cachingEnabled?: boolean;
    chunkPlan?: {
        enabled?: boolean;
        minCharacters?: number;
        punctuationBoundaries?: string;
        formatPlan?: Record<string, unknown>;
    };
    fallbackPlan?: {
        voices?: vapi_voice[];
    };
    [key: string]: unknown;  // Allow additional properties
}

// Model configuration
export interface vapi_model 
{
    provider: "openai" | "anthropic" | "together-ai" | "anyscale" | "openrouter" | "perplexity-ai" | "deepinfra" | "groq" | "custom-llm" | "vapi";
    model: string;
    temperature?: number;
    maxTokens?: number;
    messages?: vapi_mdl_message[];
    tools?: vapi_tool[];
    toolIds?: string[];
    emotionRecognitionEnabled?: boolean;
    knowledgeBase?: 
    {
        provider?: string;
        topK?: number;
        fileIds?: string[];
        [key: string]: unknown;
    };
    [key: string]: unknown;  // Allow additional properties
}

// Analysis plan configuration
export interface vapi_analysis_plan {
    summaryPlan?: {
        enabled?: boolean;
        timeoutSeconds?: number;
        messages?: unknown[];
    };
    structuredDataPlan?: {
        enabled?: boolean;
        schema?: Record<string, unknown>;
        timeoutSeconds?: number;
        messages?: unknown[];
    };
    successEvaluationPlan?: {
        enabled?: boolean;
        rubric?: string;
        messages?: unknown[];
        timeoutSeconds?: number;
    };
    [key: string]: unknown;
}

// Artifact plan configuration
export interface vapi_artifact_plan {
    recordingEnabled?: boolean;
    videoRecordingEnabled?: boolean;
    transcriptPlan?: {
        enabled?: boolean;
        assistantName?: string;
        userName?: string;
    };
    recordingPath?: string;
    [key: string]: unknown;
}

// Main Vapi assistant configuration
// This represents the input to the Vapi assistants.create() API
// All fields are optional to support partial configurations
export interface vapi_cfg 
{
    // Basic configuration
    name?: string;
    firstMessage?: string;
    firstMessageMode?: "assistant-speaks-first" | "assistant-speaks-first-with-model-generated-message" | "assistant-waits-for-user";

    // Core components
    transcriber?: vapi_transcriber | Record<string, unknown>;
    model?: vapi_model | Record<string, unknown>;
    voice?: vapi_voice | Record<string, unknown>;

    // Behavior settings
    clientMessages?: string[] | string;
    serverMessages?: string[] | string;
    maxDurationSeconds?: number;
    backgroundSound?: "off" | "office";
    backchannelingEnabled?: boolean;
    backgroundDenoisingEnabled?: boolean;
    modelOutputInMessagesEnabled?: boolean;

    // Transport and telephony
    transportConfigurations?: Array<Record<string, unknown>>;
    voicemailDetection?: "off" | "voicemail-detection-machine" | "voicemail-detection-human";
    voicemailMessage?: string;
    endCallMessage?: string;
    endCallPhrases?: string[];

    // Advanced features
    metadata?: Record<string, unknown>;
    analysisPlan?: vapi_analysis_plan | Record<string, unknown>;
    artifactPlan?: vapi_artifact_plan | Record<string, unknown>;
    messagePlan?: Record<string, unknown>;
    startSpeakingPlan?: Record<string, unknown>;
    stopSpeakingPlan?: Record<string, unknown>;
    monitorPlan?: Record<string, unknown>;
    credentialIds?: string[];

    // Server configuration
    server?: 
    {
        url?: string;
        timeoutSeconds?: number;
        headers?: Record<string, unknown>;
        [key: string]: unknown;
    };
    serverUrl?: string;  // Deprecated, use server.url

    // Compliance and security
    compliancePlan?: Record<string, unknown>;
    hipaaEnabled?: boolean;

    // Hooks
    hooks?: Array<Record<string, unknown>>;

    // Allow any additional properties for maximum flexibility
    [key: string]: unknown;
}

// Response from Vapi when assistant is created
export interface vapi_assistant_response 
{
    id: string;
    orgId: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
}

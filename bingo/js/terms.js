// AI Bingo terms — keep these snappy and workshop-friendly.
// Each term has a short, plain-English explanation you can read aloud.
window.AI_BINGO_TERMS = [
  {
    term: "AI",
    short: "Artificial Intelligence",
    description:
      "The umbrella term for software that performs tasks we'd normally consider 'intelligent' — recognising images, understanding language, making predictions, or generating new content."
  },
  {
    term: "LLM",
    short: "Large Language Model",
    description:
      "A huge neural network trained on enormous amounts of text. It predicts the next word over and over, which is how it can write, summarise, translate and chat. Examples: GPT‑4, Claude, Gemini."
  },
  {
    term: "GenAI",
    short: "Generative AI",
    description:
      "AI that creates new content — text, images, audio, video, code — rather than just classifying or predicting. The category that ChatGPT, Midjourney and Sora all fall into."
  },
  {
    term: "Prompt",
    short: "The instruction you give an AI",
    description:
      "Whatever you type (or send via an app) to tell the model what you want. Better prompts = better answers. In production, prompts are usually carefully engineered templates, not casual chat."
  },
  {
    term: "Prompt Engineering",
    short: "The craft of writing good prompts",
    description:
      "Designing, testing and refining the instructions given to an AI so it reliably produces the output you want. Often involves examples, role-setting, and clear formatting rules."
  },
  {
    term: "Token",
    short: "A chunk of text the model sees",
    description:
      "Models don't read words — they read tokens, which are roughly 3–4 characters each. 'Hello world' is about 2 tokens. You're billed per token in and per token out."
  },
  {
    term: "Context Window",
    short: "How much the model can 'see' at once",
    description:
      "The maximum number of tokens (input + output) a model can handle in a single request. Larger windows let you stuff in whole documents, transcripts or codebases."
  },
  {
    term: "Inference",
    short: "Running the model to get an answer",
    description:
      "The act of asking a trained model to produce an output. Training is teaching the model; inference is using it. Inference is what costs you money every time someone hits 'Send'."
  },
  {
    term: "Training",
    short: "Teaching the model from data",
    description:
      "The (very expensive) process of feeding huge datasets through a model so it learns patterns. Done once by the model maker; you almost never train an LLM from scratch yourself."
  },
  {
    term: "Fine-tuning",
    short: "Customising a pre-trained model",
    description:
      "Taking an existing model and training it a little further on your own examples so it adopts your tone, format or domain knowledge. Cheaper than training from scratch, but often overkill — try prompting and RAG first."
  },
  {
    term: "RAG",
    short: "Retrieval-Augmented Generation",
    description:
      "Before answering, the system retrieves relevant snippets from your own documents (via search or a vector DB) and pastes them into the prompt. The model then answers grounded in your data — fewer hallucinations, no retraining needed."
  },
  {
    term: "Embedding",
    short: "Turning text into numbers",
    description:
      "A list of numbers that represents the meaning of a piece of text (or image). Similar meanings = similar numbers. Embeddings are how semantic search and RAG actually work under the hood."
  },
  {
    term: "Vector Database",
    short: "A database for embeddings",
    description:
      "A specialised database (Pinecone, Weaviate, pgvector…) that stores embeddings and finds the closest matches fast. The 'memory' layer behind most RAG systems."
  },
  {
    term: "Hallucination",
    short: "When the AI confidently makes things up",
    description:
      "The model generates something that sounds right but is factually wrong — invented citations, fake product codes, made-up policies. The single biggest risk in enterprise GenAI."
  },
  {
    term: "Guardrails",
    short: "Safety rails around the model",
    description:
      "Rules and filters that keep the AI on-topic, on-brand and out of trouble. Can block PII, refuse off-topic questions, enforce tone, or check outputs before they reach a user."
  },
  {
    term: "Agent",
    short: "An AI that takes actions, not just chats",
    description:
      "An LLM hooked up to tools (search, APIs, your systems) that can plan a series of steps and execute them — book a meeting, update a record, kick off a workflow."
  },
  {
    term: "Agentic Workflow",
    short: "Multi-step automation driven by an AI",
    description:
      "A process where an AI agent decides what to do next at each step, calling tools or other agents as needed. Powerful, but needs guardrails and human checkpoints."
  },
  {
    term: "MCP",
    short: "Model Context Protocol",
    description:
      "An open standard (from Anthropic) for plugging tools and data sources into AI assistants. Think 'USB‑C for AI' — write the integration once, any compatible model can use it."
  },
  {
    term: "Copilot",
    short: "AI that works alongside a human",
    description:
      "An assistant embedded in the tools you already use (your IDE, Word, Excel, design software) that suggests, drafts or automates — but the human stays in the driving seat."
  },
  {
    term: "Chatbot",
    short: "Conversational AI interface",
    description:
      "Any system that talks back and forth with a user in natural language. Modern ones are usually an LLM plus prompts plus (often) RAG and a few tools."
  },
  {
    term: "Multimodal",
    short: "Handles more than just text",
    description:
      "A model that can take in and/or produce multiple types of content — text, images, audio, video. GPT‑4o and Gemini are multimodal; you can show them a picture and ask about it."
  },
  {
    term: "Diffusion Model",
    short: "How most AI image generators work",
    description:
      "A model that learns to turn random noise into a coherent image step by step. The tech behind Midjourney, Stable Diffusion, DALL·E and most modern image and video generators."
  },
  {
    term: "Transformer",
    short: "The architecture behind modern AI",
    description:
      "The neural network design (introduced by Google in 2017) that powers virtually every modern LLM. The 'T' in GPT stands for Transformer."
  },
  {
    term: "Neural Network",
    short: "Layers of simple maths inspired by the brain",
    description:
      "The general-purpose pattern-matching machine underneath almost all modern AI. Layers of 'neurons' that adjust their weights during training to recognise patterns."
  },
  {
    term: "Machine Learning",
    short: "Software that learns from data",
    description:
      "The broader field of AI where systems improve at a task by being shown examples, instead of being explicitly programmed. LLMs are one (very large) flavour of ML."
  },
  {
    term: "Deep Learning",
    short: "ML with many-layered neural networks",
    description:
      "The branch of machine learning that uses big, deep neural networks. Powers image recognition, speech, translation and all of generative AI."
  },
  {
    term: "Temperature",
    short: "How 'creative' the model is allowed to be",
    description:
      "A dial from 0 to 1+ that controls randomness in the model's output. Low temperature = predictable and consistent. High temperature = more varied and creative (and more error-prone)."
  },
  {
    term: "Foundation Model",
    short: "A big general-purpose model others build on",
    description:
      "A large model trained on broad data that can be adapted to many downstream tasks. GPT‑4, Claude and Gemini are foundation models; your chatbot is built on top of one."
  },
  {
    term: "Zero-shot",
    short: "Doing a task with no examples",
    description:
      "Asking the model to do something it hasn't been shown examples of, just from the instructions. Modern LLMs are surprisingly good at this."
  },
  {
    term: "Few-shot",
    short: "Showing the model a handful of examples",
    description:
      "Including 2–5 worked examples in your prompt so the model picks up the pattern and applies it to a new case. Often a huge accuracy boost over zero-shot."
  },
  {
    term: "Chain of Thought",
    short: "Asking the model to 'show its working'",
    description:
      "A prompting technique where you ask the model to reason step by step before giving its final answer. Improves accuracy on logic, maths and multi-step problems."
  },
  {
    term: "Bias",
    short: "Skew baked into the model",
    description:
      "Patterns picked up from training data that lead to unfair, stereotyped or skewed outputs. Has to be actively tested for and mitigated, especially in HR, finance and customer-facing use cases."
  },
  {
    term: "Alignment",
    short: "Making AI do what we actually want",
    description:
      "The discipline of getting a model's behaviour to match human intentions and values — not just literal instructions. RLHF is one alignment technique."
  },
  {
    term: "RLHF",
    short: "Reinforcement Learning from Human Feedback",
    description:
      "How models like ChatGPT are taught to be helpful and polite: humans rank responses, and the model is fine-tuned to produce more of the highly-rated kind."
  },
  {
    term: "Synthetic Data",
    short: "AI-generated training data",
    description:
      "Data created by a model (rather than collected from the real world) and used to train or test other models. Useful when real data is scarce, sensitive, or expensive."
  },
  {
    term: "AGI",
    short: "Artificial General Intelligence",
    description:
      "A hypothetical AI that can match or exceed humans across essentially any cognitive task. We don't have it. People disagree wildly on how close we are."
  },
  {
    term: "Computer Vision",
    short: "AI that 'sees'",
    description:
      "Models that interpret images and video — detecting objects, reading text, spotting defects, classifying scenes. The eyes of automation in graphics and supply-chain workflows."
  },
  {
    term: "OCR",
    short: "Optical Character Recognition",
    description:
      "Turning images of text (scanned invoices, labels, packshots, PDFs) into machine-readable text. Modern AI-powered OCR handles messy real-world documents far better than the old kind."
  },
  {
    term: "NLP",
    short: "Natural Language Processing",
    description:
      "The field of getting computers to understand and generate human language. LLMs are the current state-of-the-art tool for almost every NLP task."
  },
  {
    term: "Structured Output",
    short: "Forcing the model to reply in a fixed format",
    description:
      "Constraining the model to return clean JSON (or another schema) so its answer can be plugged straight into another system. Essential for reliable automation."
  },
  {
    term: "API",
    short: "How software talks to the AI",
    description:
      "An Application Programming Interface — the endpoint your code calls to send a prompt and get a response. Every model provider exposes one; it's how AI gets embedded into real workflows."
  },
  {
    term: "Latency",
    short: "How long the AI takes to respond",
    description:
      "The delay between sending a request and getting a reply. Matters a lot for chatbots and real-time tools; less so for batch jobs that run overnight."
  },
  {
    term: "Workflow Automation",
    short: "Stitching steps together so they run themselves",
    description:
      "Connecting AI models, business systems and approvals into an end-to-end process that runs with minimal human intervention. The whole point of most enterprise AI projects."
  },
  {
    term: "Human-in-the-loop",
    short: "A human checkpoint inside an AI process",
    description:
      "A workflow design where a person reviews, approves or corrects the AI's output before it goes live. The default setting for anything high-stakes or brand-sensitive."
  }
];

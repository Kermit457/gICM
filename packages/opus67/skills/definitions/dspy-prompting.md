# DSPy Prompting Expert

> **ID:** `dspy-prompting`
> **Tier:** 2
> **Token Cost:** 7500
> **MCP Connections:** N/A

## 🎯 What This Skill Does

You are an expert in DSPy (Declarative Self-improving Language Programs), a framework for programming with foundation models. You understand signatures, modules, optimizers, teleprompts, bootstrapping, and building self-improving AI systems.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** dspy, prompt engineering, optimization, bootstrapping, teleprompt, signature, chain-of-thought
- **File Types:** N/A
- **Directories:** `dspy/`, `prompts/`, `optimization/`

## 🚀 Core Capabilities

### 1. DSPy Overview & Philosophy

**What is DSPy?**

```python
"""
DSPy shifts from manual prompt engineering to programmatic AI development:

TRADITIONAL APPROACH:
- Write prompts manually
- Test and iterate
- Hard to maintain
- Doesn't improve automatically

DSPY APPROACH:
- Define task signature (inputs → outputs)
- Use modules (ChainOfThought, ReAct, etc.)
- Optimize with compilers
- Auto-improve with examples
"""

# Traditional prompt engineering
prompt = f"""
You are a helpful assistant. Answer this question:

Question: {question}

Provide a detailed answer with reasoning.
"""

# DSPy approach
import dspy

class QA(dspy.Signature):
    """Answer questions with detailed reasoning."""
    question = dspy.InputField()
    answer = dspy.OutputField(desc="detailed answer with reasoning")

# Use pre-built module
qa = dspy.ChainOfThought(QA)
result = qa(question="What is quantum computing?")
print(result.answer)
```

**Key Concepts:**

```python
# 1. Signatures - Define input/output behavior
class MySignature(dspy.Signature):
    """Task description."""
    input1 = dspy.InputField(desc="description")
    output1 = dspy.OutputField(desc="description")

# 2. Modules - Reusable components
predictor = dspy.Predict(MySignature)  # Basic
cot = dspy.ChainOfThought(MySignature)  # With reasoning
react = dspy.ReAct(MySignature)  # With tool use

# 3. Optimizers - Improve automatically
optimizer = dspy.BootstrapFewShot(metric=my_metric)
optimized = optimizer.compile(predictor, trainset=examples)

# 4. Language Models - Backend
lm = dspy.OpenAI(model="gpt-4")
dspy.settings.configure(lm=lm)
```

### 2. Installation & Setup

**Setup DSPy:**

```bash
# Install DSPy
pip install dspy-ai

# Optional: Install specific LM integrations
pip install openai anthropic cohere
```

**Configuration:**

```python
import dspy
import os

# Configure OpenAI
lm = dspy.OpenAI(
    model="gpt-4-turbo-preview",
    api_key=os.getenv("OPENAI_API_KEY"),
    max_tokens=1000,
    temperature=0.7
)

dspy.settings.configure(lm=lm)

# Configure multiple models
gpt4 = dspy.OpenAI(model="gpt-4")
gpt35 = dspy.OpenAI(model="gpt-3.5-turbo")
claude = dspy.Claude(model="claude-3-opus-20240229")

# Use specific model for a block
with dspy.settings.context(lm=gpt4):
    result = predictor(input="...")

# Configure with caching
lm = dspy.OpenAI(
    model="gpt-4",
    cache=True,  # Enable caching
    cache_dir=".dspy_cache"
)

# Configure with retries
lm = dspy.OpenAI(
    model="gpt-4",
    max_retries=3,
    timeout=30
)
```

### 3. Signatures - Defining Tasks

**Basic Signatures:**

```python
# Simple signature
class Summarize(dspy.Signature):
    """Summarize the given text."""
    text = dspy.InputField()
    summary = dspy.OutputField()

# Multi-input signature
class CompareDocuments(dspy.Signature):
    """Compare two documents and identify key differences."""
    document1 = dspy.InputField(desc="first document")
    document2 = dspy.InputField(desc="second document")
    differences = dspy.OutputField(desc="list of key differences")

# Multi-output signature
class AnalyzeSentiment(dspy.Signature):
    """Analyze sentiment of text."""
    text = dspy.InputField()
    sentiment = dspy.OutputField(desc="positive, negative, or neutral")
    confidence = dspy.OutputField(desc="confidence score 0-1")
    reasoning = dspy.OutputField(desc="explanation of sentiment")

# Inline signature (shorthand)
summarize = dspy.Predict("text -> summary")
result = summarize(text="Long text here...")
```

**Advanced Signatures:**

```python
# With type hints
class ExtractEntities(dspy.Signature):
    """Extract named entities from text."""
    text: str = dspy.InputField()
    people: list[str] = dspy.OutputField(desc="person names")
    organizations: list[str] = dspy.OutputField(desc="organization names")
    locations: list[str] = dspy.OutputField(desc="location names")

# With constraints
class GenerateCode(dspy.Signature):
    """Generate code based on description."""
    description = dspy.InputField()
    language = dspy.InputField(desc="programming language")
    code = dspy.OutputField(
        desc="complete, runnable code with no syntax errors"
    )

# With formatting
class StructuredOutput(dspy.Signature):
    """Extract structured information."""
    text = dspy.InputField()
    json_output = dspy.OutputField(
        desc="valid JSON with keys: name, age, occupation"
    )

# With examples in description
class ClassifyIntent(dspy.Signature):
    """Classify user intent.

    Examples:
    - "Book a flight to NYC" -> travel
    - "What's the weather?" -> information
    - "Set a reminder" -> task_management
    """
    user_message = dspy.InputField()
    intent = dspy.OutputField(
        desc="one of: travel, information, task_management, other"
    )
```

### 4. Modules - Building Blocks

**Predict (Basic):**

```python
# Basic prediction
class BasicQA(dspy.Signature):
    question = dspy.InputField()
    answer = dspy.OutputField()

qa = dspy.Predict(BasicQA)
result = qa(question="What is DSPy?")
print(result.answer)

# Inline predict
predict = dspy.Predict("question -> answer")
result = predict(question="What is DSPy?")
```

**ChainOfThought (Reasoning):**

```python
# Add reasoning step
class MathProblem(dspy.Signature):
    problem = dspy.InputField()
    answer = dspy.OutputField()

# Without CoT
basic = dspy.Predict(MathProblem)
result = basic(problem="What is 15% of 240?")
# Just gives answer

# With CoT
cot = dspy.ChainOfThought(MathProblem)
result = cot(problem="What is 15% of 240?")
print(result.reasoning)  # Shows step-by-step reasoning
print(result.answer)     # Final answer

# Custom reasoning field
class DetailedQA(dspy.Signature):
    question = dspy.InputField()
    reasoning = dspy.OutputField(desc="step-by-step reasoning")
    answer = dspy.OutputField()

cot_qa = dspy.ChainOfThought(DetailedQA)
```

**ChainOfThoughtWithHint:**

```python
# Provide hints for better reasoning
class ComplexMath(dspy.Signature):
    problem = dspy.InputField()
    answer = dspy.OutputField()

cot_hint = dspy.ChainOfThoughtWithHint(ComplexMath)

result = cot_hint(
    problem="Solve: 2x + 5 = 15",
    hint="First subtract 5 from both sides"
)
```

**ProgramOfThought (Code Execution):**

```python
# Generate and execute code
class MathWithCode(dspy.Signature):
    problem = dspy.InputField()
    answer = dspy.OutputField()

pot = dspy.ProgramOfThought(MathWithCode)
result = pot(problem="Calculate factorial of 10")
# Generates Python code, executes it, returns result
```

**ReAct (Tool Use):**

```python
# ReAct pattern: Reasoning + Acting
class ResearchQuestion(dspy.Signature):
    question = dspy.InputField()
    answer = dspy.OutputField()

# Define tools
def search_web(query: str) -> str:
    """Search the web for information."""
    # Your search implementation
    return f"Search results for: {query}"

def calculate(expression: str) -> float:
    """Evaluate a mathematical expression."""
    return eval(expression)

# Create ReAct module
react = dspy.ReAct(
    ResearchQuestion,
    tools=[search_web, calculate]
)

result = react(question="What is the GDP of France in 2023?")
# Will reason about what tools to use, call them, and synthesize answer
```

**Retry:**

```python
# Retry with validation
class ValidatedOutput(dspy.Signature):
    input_text = dspy.InputField()
    output = dspy.OutputField()

def validate_output(output: str) -> bool:
    """Validate output meets requirements."""
    return len(output) > 10 and output[0].isupper()

retry = dspy.Retry(
    dspy.ChainOfThought(ValidatedOutput),
    validation_fn=validate_output,
    max_retries=3
)

result = retry(input_text="Generate a title")
```

**MultiChainComparison:**

```python
# Generate multiple candidates and compare
class CreativeTask(dspy.Signature):
    prompt = dspy.InputField()
    output = dspy.OutputField()

comparison = dspy.MultiChainComparison(
    dspy.ChainOfThought(CreativeTask),
    M=3  # Generate 3 candidates
)

result = comparison(prompt="Write a tagline for a coffee shop")
# Returns best of 3 outputs
```

### 5. Custom Modules

**Create Custom Module:**

```python
import dspy

class RAGModule(dspy.Module):
    """Retrieval-Augmented Generation module."""

    def __init__(self, num_passages=3):
        super().__init__()
        self.num_passages = num_passages

        # Define sub-modules
        self.retrieve = dspy.Retrieve(k=num_passages)
        self.generate_answer = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        # Retrieve relevant passages
        context = self.retrieve(question).passages

        # Generate answer with context
        result = self.generate_answer(
            context="\n\n".join(context),
            question=question
        )

        return result

# Usage
rag = RAGModule(num_passages=5)
result = rag(question="What is machine learning?")
```

**Complex Multi-Stage Module:**

```python
class ResearchPipeline(dspy.Module):
    """Multi-stage research pipeline."""

    def __init__(self):
        super().__init__()

        # Stage 1: Break down question
        self.decompose = dspy.ChainOfThought(
            "question -> sub_questions"
        )

        # Stage 2: Research each sub-question
        self.research = dspy.ChainOfThought(
            "sub_question -> findings"
        )

        # Stage 3: Synthesize final answer
        self.synthesize = dspy.ChainOfThought(
            "question, findings -> comprehensive_answer"
        )

    def forward(self, question):
        # Decompose into sub-questions
        decomposition = self.decompose(question=question)
        sub_questions = decomposition.sub_questions.split("\n")

        # Research each sub-question
        findings = []
        for sub_q in sub_questions:
            result = self.research(sub_question=sub_q)
            findings.append(result.findings)

        # Synthesize final answer
        final = self.synthesize(
            question=question,
            findings="\n\n".join(findings)
        )

        return dspy.Prediction(
            sub_questions=sub_questions,
            findings=findings,
            answer=final.comprehensive_answer
        )

# Usage
pipeline = ResearchPipeline()
result = pipeline(question="How does climate change affect agriculture?")
```

**Module with State:**

```python
class ConversationAgent(dspy.Module):
    """Stateful conversation agent."""

    def __init__(self):
        super().__init__()
        self.history = []

        self.respond = dspy.ChainOfThought(
            "history, user_message -> response"
        )

    def forward(self, user_message):
        # Format history
        history_str = "\n".join([
            f"{'User' if i % 2 == 0 else 'Assistant'}: {msg}"
            for i, msg in enumerate(self.history)
        ])

        # Generate response
        result = self.respond(
            history=history_str,
            user_message=user_message
        )

        # Update history
        self.history.append(user_message)
        self.history.append(result.response)

        return result

    def reset(self):
        self.history = []

# Usage
agent = ConversationAgent()
response1 = agent(user_message="Hello!")
response2 = agent(user_message="What's the weather?")
```

### 6. Optimization & Compilation

**BootstrapFewShot (Basic Optimization):**

```python
# Define metric
def validate_answer(example, pred, trace=None):
    """Check if prediction is correct."""
    return example.answer.lower() in pred.answer.lower()

# Create training set
trainset = [
    dspy.Example(
        question="What is the capital of France?",
        answer="Paris"
    ).with_inputs("question"),
    dspy.Example(
        question="What is 2+2?",
        answer="4"
    ).with_inputs("question"),
    # ... more examples
]

# Define module
class QA(dspy.Signature):
    question = dspy.InputField()
    answer = dspy.OutputField()

qa = dspy.ChainOfThought(QA)

# Optimize
optimizer = dspy.BootstrapFewShot(
    metric=validate_answer,
    max_bootstrapped_demos=4,
    max_labeled_demos=4
)

optimized_qa = optimizer.compile(
    student=qa,
    trainset=trainset
)

# Use optimized version
result = optimized_qa(question="What is the capital of Spain?")
```

**BootstrapFewShotWithRandomSearch:**

```python
# Optimize with random search over demos
optimizer = dspy.BootstrapFewShotWithRandomSearch(
    metric=validate_answer,
    max_bootstrapped_demos=4,
    max_labeled_demos=4,
    num_candidate_programs=10,  # Try 10 combinations
    num_threads=4  # Parallel evaluation
)

optimized = optimizer.compile(
    student=qa,
    trainset=trainset,
    valset=valset  # Validation set
)
```

**MIPRO (Advanced Optimization):**

```python
# Multi-stage optimization
from dspy.teleprompt import MIPRO

optimizer = MIPRO(
    metric=validate_answer,
    num_candidates=10,
    init_temperature=1.0
)

optimized = optimizer.compile(
    student=qa,
    trainset=trainset,
    valset=valset,
    num_trials=50  # Number of optimization trials
)
```

**Custom Optimization:**

```python
class CustomOptimizer:
    """Custom optimization strategy."""

    def __init__(self, metric, num_iterations=10):
        self.metric = metric
        self.num_iterations = num_iterations

    def compile(self, student, trainset):
        best_program = student
        best_score = 0

        for i in range(self.num_iterations):
            # Generate candidate
            candidate = self.generate_candidate(student, trainset)

            # Evaluate
            score = self.evaluate(candidate, trainset)

            # Update best
            if score > best_score:
                best_score = score
                best_program = candidate
                print(f"Iteration {i}: New best score {score}")

        return best_program

    def generate_candidate(self, program, trainset):
        # Your candidate generation logic
        return program

    def evaluate(self, program, dataset):
        correct = 0
        for example in dataset:
            pred = program(**example.inputs())
            if self.metric(example, pred):
                correct += 1
        return correct / len(dataset)
```

### 7. Evaluation & Metrics

**Define Metrics:**

```python
# Exact match
def exact_match(example, pred, trace=None):
    return example.answer.strip().lower() == pred.answer.strip().lower()

# Contains
def contains_answer(example, pred, trace=None):
    return example.answer.lower() in pred.answer.lower()

# F1 score
def f1_score(example, pred, trace=None):
    pred_tokens = set(pred.answer.lower().split())
    gold_tokens = set(example.answer.lower().split())

    if len(pred_tokens) == 0 or len(gold_tokens) == 0:
        return 0

    common = pred_tokens & gold_tokens
    precision = len(common) / len(pred_tokens)
    recall = len(common) / len(gold_tokens)

    if precision + recall == 0:
        return 0

    return 2 * (precision * recall) / (precision + recall)

# Custom validation
def validate_structured_output(example, pred, trace=None):
    """Validate JSON output."""
    import json
    try:
        data = json.loads(pred.json_output)
        required_keys = ["name", "age", "occupation"]
        return all(key in data for key in required_keys)
    except:
        return False

# Semantic similarity
def semantic_similarity(example, pred, trace=None):
    """Use embeddings to compare."""
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')

    emb1 = model.encode(example.answer)
    emb2 = model.encode(pred.answer)

    similarity = cosine_similarity([emb1], [emb2])[0][0]
    return similarity > 0.8  # Threshold
```

**Evaluate Module:**

```python
from dspy.evaluate import Evaluate

# Create evaluator
evaluator = Evaluate(
    devset=testset,
    metric=validate_answer,
    num_threads=4,
    display_progress=True,
    display_table=True
)

# Evaluate
score = evaluator(optimized_qa)
print(f"Accuracy: {score}")

# Detailed evaluation
def detailed_metric(example, pred, trace=None):
    correct = example.answer.lower() in pred.answer.lower()
    return {
        "correct": correct,
        "pred_length": len(pred.answer),
        "has_reasoning": hasattr(pred, "reasoning")
    }

results = []
for example in testset:
    pred = optimized_qa(**example.inputs())
    result = detailed_metric(example, pred)
    results.append(result)

# Analyze
accuracy = sum(r["correct"] for r in results) / len(results)
avg_length = sum(r["pred_length"] for r in results) / len(results)
print(f"Accuracy: {accuracy:.2%}")
print(f"Avg length: {avg_length:.0f} chars")
```

### 8. Advanced Patterns

**Multi-Hop Reasoning:**

```python
class MultiHopQA(dspy.Module):
    """Answer questions requiring multiple reasoning steps."""

    def __init__(self, num_hops=3):
        super().__init__()
        self.num_hops = num_hops

        # Generate sub-question
        self.generate_query = dspy.ChainOfThought(
            "question, context -> search_query"
        )

        # Retrieve context
        self.retrieve = dspy.Retrieve(k=3)

        # Final answer
        self.answer = dspy.ChainOfThought(
            "question, context -> answer"
        )

    def forward(self, question):
        context = []

        # Perform multiple hops
        for hop in range(self.num_hops):
            # Generate search query
            query_gen = self.generate_query(
                question=question,
                context="\n".join(context)
            )

            # Retrieve
            passages = self.retrieve(query_gen.search_query).passages
            context.extend(passages)

        # Generate final answer
        result = self.answer(
            question=question,
            context="\n\n".join(context)
        )

        return result
```

**Self-Consistency:**

```python
class SelfConsistentQA(dspy.Module):
    """Generate multiple answers and take majority vote."""

    def __init__(self, num_samples=5):
        super().__init__()
        self.num_samples = num_samples
        self.qa = dspy.ChainOfThought("question -> answer")

    def forward(self, question):
        # Generate multiple answers
        answers = []
        for _ in range(self.num_samples):
            result = self.qa(question=question)
            answers.append(result.answer)

        # Majority vote (simple version)
        from collections import Counter
        most_common = Counter(answers).most_common(1)[0][0]

        return dspy.Prediction(
            answer=most_common,
            all_answers=answers
        )
```

**Mixture of Experts:**

```python
class MixtureOfExperts(dspy.Module):
    """Route questions to specialized models."""

    def __init__(self):
        super().__init__()

        # Router
        self.router = dspy.Predict(
            "question -> category"
        )

        # Specialized experts
        self.math_expert = dspy.ChainOfThought("math_problem -> solution")
        self.history_expert = dspy.ChainOfThought("history_question -> answer")
        self.science_expert = dspy.ChainOfThought("science_question -> answer")

        self.experts = {
            "math": self.math_expert,
            "history": self.history_expert,
            "science": self.science_expert
        }

    def forward(self, question):
        # Route to expert
        route = self.router(question=question)
        category = route.category.lower()

        # Get expert
        expert = self.experts.get(category, self.science_expert)

        # Generate answer
        result = expert(question)

        return dspy.Prediction(
            answer=result.answer if hasattr(result, 'answer') else result.solution,
            category=category
        )
```

**Iterative Refinement:**

```python
class IterativeRefinement(dspy.Module):
    """Iteratively improve an answer."""

    def __init__(self, max_iterations=3):
        super().__init__()
        self.max_iterations = max_iterations

        self.generate = dspy.ChainOfThought("task -> output")
        self.critique = dspy.ChainOfThought("output -> critique, score")
        self.refine = dspy.ChainOfThought("output, critique -> improved_output")

    def forward(self, task):
        # Initial generation
        result = self.generate(task=task)
        current_output = result.output

        for i in range(self.max_iterations):
            # Critique
            critique_result = self.critique(output=current_output)
            score = float(critique_result.score)

            # If good enough, stop
            if score >= 9.0:
                break

            # Refine
            refined = self.refine(
                output=current_output,
                critique=critique_result.critique
            )
            current_output = refined.improved_output

        return dspy.Prediction(
            output=current_output,
            iterations=i + 1
        )
```

### 9. Production Patterns

**Error Handling:**

```python
class RobustQA(dspy.Module):
    """QA with error handling and fallbacks."""

    def __init__(self):
        super().__init__()
        self.primary = dspy.ChainOfThought("question -> answer")
        self.fallback = dspy.Predict("question -> answer")

    def forward(self, question):
        try:
            # Try primary method
            result = self.primary(question=question)

            # Validate
            if len(result.answer) < 10:
                raise ValueError("Answer too short")

            return result

        except Exception as e:
            print(f"Primary failed: {e}, using fallback")

            # Use fallback
            try:
                result = self.fallback(question=question)
                return result
            except Exception as e2:
                # Return error response
                return dspy.Prediction(
                    answer="I apologize, but I cannot answer that question right now.",
                    error=str(e2)
                )
```

**Caching:**

```python
import hashlib
import json
from functools import lru_cache

class CachedQA(dspy.Module):
    """QA with caching."""

    def __init__(self):
        super().__init__()
        self.qa = dspy.ChainOfThought("question -> answer")
        self.cache = {}

    def forward(self, question):
        # Generate cache key
        cache_key = hashlib.md5(question.encode()).hexdigest()

        # Check cache
        if cache_key in self.cache:
            print("Cache hit!")
            return self.cache[cache_key]

        # Generate answer
        result = self.qa(question=question)

        # Store in cache
        self.cache[cache_key] = result

        return result
```

**Batch Processing:**

```python
class BatchProcessor(dspy.Module):
    """Process multiple inputs efficiently."""

    def __init__(self, batch_size=10):
        super().__init__()
        self.batch_size = batch_size
        self.qa = dspy.ChainOfThought("question -> answer")

    def process_batch(self, questions):
        results = []

        for i in range(0, len(questions), self.batch_size):
            batch = questions[i:i + self.batch_size]

            # Process batch in parallel
            batch_results = []
            for question in batch:
                result = self.qa(question=question)
                batch_results.append(result)

            results.extend(batch_results)

        return results
```

**Monitoring & Logging:**

```python
import time
from datetime import datetime

class MonitoredQA(dspy.Module):
    """QA with monitoring and logging."""

    def __init__(self):
        super().__init__()
        self.qa = dspy.ChainOfThought("question -> answer")
        self.metrics = {
            "total_requests": 0,
            "total_time": 0,
            "errors": 0
        }

    def forward(self, question):
        start_time = time.time()
        self.metrics["total_requests"] += 1

        try:
            # Log request
            print(f"[{datetime.now()}] Processing: {question[:50]}...")

            # Process
            result = self.qa(question=question)

            # Track latency
            latency = time.time() - start_time
            self.metrics["total_time"] += latency

            # Log success
            print(f"[{datetime.now()}] Completed in {latency:.2f}s")

            return result

        except Exception as e:
            self.metrics["errors"] += 1
            print(f"[{datetime.now()}] Error: {e}")
            raise

    def get_metrics(self):
        avg_time = (
            self.metrics["total_time"] / self.metrics["total_requests"]
            if self.metrics["total_requests"] > 0
            else 0
        )

        return {
            **self.metrics,
            "avg_latency": avg_time,
            "error_rate": self.metrics["errors"] / max(self.metrics["total_requests"], 1)
        }
```

### 10. Real-World Examples

**RAG System:**

```python
class ProductionRAG(dspy.Module):
    """Production-ready RAG system."""

    def __init__(self, index_name="documents"):
        super().__init__()

        # Configure retrieval
        self.retrieve = dspy.Retrieve(k=5)

        # Re-rank passages
        self.rerank = dspy.Predict(
            "question, passage -> relevance_score"
        )

        # Generate with citations
        self.generate = dspy.ChainOfThought(
            "question, context -> answer, citations"
        )

    def forward(self, question):
        # Retrieve candidates
        passages = self.retrieve(question).passages

        # Re-rank
        scored_passages = []
        for passage in passages:
            score_result = self.rerank(
                question=question,
                passage=passage
            )
            score = float(score_result.relevance_score)
            scored_passages.append((passage, score))

        # Sort by relevance
        scored_passages.sort(key=lambda x: x[1], reverse=True)
        top_passages = [p[0] for p in scored_passages[:3]]

        # Generate answer
        result = self.generate(
            question=question,
            context="\n\n".join(top_passages)
        )

        return dspy.Prediction(
            answer=result.answer,
            citations=result.citations,
            passages=top_passages
        )
```

**Code Generation:**

```python
class CodeGenerator(dspy.Module):
    """Generate and validate code."""

    def __init__(self):
        super().__init__()

        self.generate = dspy.ChainOfThought(
            "description, language -> code, explanation"
        )

        self.review = dspy.ChainOfThought(
            "code -> issues, suggestions"
        )

        self.fix = dspy.ChainOfThought(
            "code, issues -> fixed_code"
        )

    def forward(self, description, language="python"):
        # Generate initial code
        result = self.generate(
            description=description,
            language=language
        )

        # Review for issues
        review = self.review(code=result.code)

        # Fix if needed
        if "error" in review.issues.lower() or "bug" in review.issues.lower():
            fixed = self.fix(
                code=result.code,
                issues=review.issues
            )
            final_code = fixed.fixed_code
        else:
            final_code = result.code

        return dspy.Prediction(
            code=final_code,
            explanation=result.explanation,
            review=review.issues
        )
```

**Agent System:**

```python
class AgentSystem(dspy.Module):
    """Multi-step agent with tools."""

    def __init__(self, tools):
        super().__init__()
        self.tools = tools

        self.planner = dspy.ChainOfThought(
            "goal, available_tools -> plan"
        )

        self.executor = dspy.ReAct(
            "step, context -> action, observation"
        )

        self.synthesizer = dspy.ChainOfThought(
            "goal, observations -> final_answer"
        )

    def forward(self, goal):
        # Create plan
        tool_names = [tool.__name__ for tool in self.tools]
        plan_result = self.planner(
            goal=goal,
            available_tools=", ".join(tool_names)
        )

        # Execute steps
        observations = []
        steps = plan_result.plan.split("\n")

        for step in steps:
            if not step.strip():
                continue

            result = self.executor(
                step=step,
                context="\n".join(observations)
            )
            observations.append(f"{step}: {result.observation}")

        # Synthesize final answer
        final = self.synthesizer(
            goal=goal,
            observations="\n".join(observations)
        )

        return dspy.Prediction(
            answer=final.final_answer,
            plan=steps,
            observations=observations
        )
```

## 🎓 Best Practices

### Signature Design
- Write clear, descriptive docstrings
- Use specific field descriptions
- Include examples in docstrings
- Keep signatures focused and simple

### Module Development
- Break complex tasks into stages
- Use appropriate module types (Predict, CoT, ReAct)
- Add validation and error handling
- Make modules composable

### Optimization
- Start with good training examples
- Define clear metrics
- Use validation sets
- Try multiple optimizers
- Monitor optimization progress

### Production
- Add error handling and fallbacks
- Implement caching for repeated queries
- Monitor performance and costs
- Log important events
- Use batch processing when possible

### Testing
- Test with diverse inputs
- Validate outputs programmatically
- Compare optimized vs base performance
- Test edge cases

## 📊 Performance Tips

- Use `Predict` for simple tasks (faster)
- Use `ChainOfThought` for complex reasoning
- Cache LM calls during development
- Optimize with representative training data
- Monitor token usage and costs

## 🔗 Resources

- [DSPy Docs](https://dspy-docs.vercel.app/)
- [DSPy GitHub](https://github.com/stanfordnlp/dspy)
- [DSPy Examples](https://github.com/stanfordnlp/dspy/tree/main/examples)
- [Paper: DSPy](https://arxiv.org/abs/2310.03714)

---

**Remember:** DSPy shifts from prompt engineering to programming with LMs. Define what you want (signatures), not how to get it (prompts). Let optimizers find the best prompts automatically.

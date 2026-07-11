# Andrej Karpathy Repositories: READMEs and Documentation

Collected on 2026-04-26 from GitHub repositories via `gh api` raw content endpoints and a targeted web fetch.

## karpathy/nanoGPT (branch: `master`)

### `README.md`

```markdown

# nanoGPT

![nanoGPT](assets/nanogpt.jpg)


---

**Update Nov 2025** nanoGPT has a new and improved cousin called [nanochat](https://github.com/karpathy/nanochat). It is very likely you meant to use/find nanochat instead. nanoGPT (this repo) is now very old and deprecated but I will leave it up for posterity.

---

The simplest, fastest repository for training/finetuning medium-sized GPTs. It is a rewrite of [minGPT](https://github.com/karpathy/minGPT) that prioritizes teeth over education. Still under active development, but currently the file `train.py` reproduces GPT-2 (124M) on OpenWebText, running on a single 8XA100 40GB node in about 4 days of training. The code itself is plain and readable: `train.py` is a ~300-line boilerplate training loop and `model.py` a ~300-line GPT model definition, which can optionally load the GPT-2 weights from OpenAI. That's it.

![repro124m](assets/gpt2_124M_loss.png)

Because the code is so simple, it is very easy to hack to your needs, train new models from scratch, or finetune pretrained checkpoints (e.g. biggest one currently available as a starting point would be the GPT-2 1.3B model from OpenAI).

## install

```
pip install torch numpy transformers datasets tiktoken wandb tqdm
```

Dependencies:

- [pytorch](https://pytorch.org) <3
- [numpy](https://numpy.org/install/) <3
-  `transformers` for huggingface transformers <3 (to load GPT-2 checkpoints)
-  `datasets` for huggingface datasets <3 (if you want to download + preprocess OpenWebText)
-  `tiktoken` for OpenAI's fast BPE code <3
-  `wandb` for optional logging <3
-  `tqdm` for progress bars <3

## quick start

If you are not a deep learning professional and you just want to feel the magic and get your feet wet, the fastest way to get started is to train a character-level GPT on the works of Shakespeare. First, we download it as a single (1MB) file and turn it from raw text into one large stream of integers:

```sh
python data/shakespeare_char/prepare.py
```

This creates a `train.bin` and `val.bin` in that data directory. Now it is time to train your GPT. The size of it very much depends on the computational resources of your system:

**I have a GPU**. Great, we can quickly train a baby GPT with the settings provided in the [config/train_shakespeare_char.py](config/train_shakespeare_char.py) config file:

```sh
python train.py config/train_shakespeare_char.py
```

If you peek inside it, you'll see that we're training a GPT with a context size of up to 256 characters, 384 feature channels, and it is a 6-layer Transformer with 6 heads in each layer. On one A100 GPU this training run takes about 3 minutes and the best validation loss is 1.4697. Based on the configuration, the model checkpoints are being written into the `--out_dir` directory `out-shakespeare-char`. So once the training finishes we can sample from the best model by pointing the sampling script at this directory:

```sh
python sample.py --out_dir=out-shakespeare-char
```

This generates a few samples, for example:

```
ANGELO:
And cowards it be strawn to my bed,
And thrust the gates of my threats,
Because he that ale away, and hang'd
An one with him.

DUKE VINCENTIO:
I thank your eyes against it.

DUKE VINCENTIO:
Then will answer him to save the malm:
And what have you tyrannous shall do this?

DUKE VINCENTIO:
If you have done evils of all disposition
To end his power, the day of thrust for a common men
That I leave, to fight with over-liking
Hasting in a roseman.
```

lol  `¯\_(ツ)_/¯`. Not bad for a character-level model after 3 minutes of training on a GPU. Better results are quite likely obtainable by instead finetuning a pretrained GPT-2 model on this dataset (see finetuning section later).

**I only have a macbook** (or other cheap computer). No worries, we can still train a GPT but we want to dial things down a notch. I recommend getting the bleeding edge PyTorch nightly ([select it here](https://pytorch.org/get-started/locally/) when installing) as it is currently quite likely to make your code more efficient. But even without it, a simple train run could look as follows:

```sh
python train.py config/train_shakespeare_char.py --device=cpu --compile=False --eval_iters=20 --log_interval=1 --block_size=64 --batch_size=12 --n_layer=4 --n_head=4 --n_embd=128 --max_iters=2000 --lr_decay_iters=2000 --dropout=0.0
```

Here, since we are running on CPU instead of GPU we must set both `--device=cpu` and also turn off PyTorch 2.0 compile with `--compile=False`. Then when we evaluate we get a bit more noisy but faster estimate (`--eval_iters=20`, down from 200), our context size is only 64 characters instead of 256, and the batch size only 12 examples per iteration, not 64. We'll also use a much smaller Transformer (4 layers, 4 heads, 128 embedding size), and decrease the number of iterations to 2000 (and correspondingly usually decay the learning rate to around max_iters with `--lr_decay_iters`). Because our network is so small we also ease down on regularization (`--dropout=0.0`). This still runs in about ~3 minutes, but gets us a loss of only 1.88 and therefore also worse samples, but it's still good fun:

```sh
python sample.py --out_dir=out-shakespeare-char --device=cpu
```
Generates samples like this:

```
GLEORKEN VINGHARD III:
Whell's the couse, the came light gacks,
And the for mought you in Aut fries the not high shee
bot thou the sought bechive in that to doth groan you,
No relving thee post mose the wear
```

Not bad for ~3 minutes on a CPU, for a hint of the right character gestalt. If you're willing to wait longer, feel free to tune the hyperparameters, increase the size of the network, the context length (`--block_size`), the length of training, etc.

Finally, on Apple Silicon Macbooks and with a recent PyTorch version make sure to add `--device=mps` (short for "Metal Performance Shaders"); PyTorch then uses the on-chip GPU that can *significantly* accelerate training (2-3X) and allow you to use larger networks. See [Issue 28](https://github.com/karpathy/nanoGPT/issues/28) for more.

## reproducing GPT-2

A more serious deep learning professional may be more interested in reproducing GPT-2 results. So here we go - we first tokenize the dataset, in this case the [OpenWebText](https://openwebtext2.readthedocs.io/en/latest/), an open reproduction of OpenAI's (private) WebText:

```sh
python data/openwebtext/prepare.py
```

This downloads and tokenizes the [OpenWebText](https://huggingface.co/datasets/openwebtext) dataset. It will create a `train.bin` and `val.bin` which holds the GPT2 BPE token ids in one sequence, stored as raw uint16 bytes. Then we're ready to kick off training. To reproduce GPT-2 (124M) you'll want at least an 8X A100 40GB node and run:

```sh
torchrun --standalone --nproc_per_node=8 train.py config/train_gpt2.py
```

This will run for about 4 days using PyTorch Distributed Data Parallel (DDP) and go down to loss of ~2.85. Now, a GPT-2 model just evaluated on OWT gets a val loss of about 3.11, but if you finetune it it will come down to ~2.85 territory (due to an apparent domain gap), making the two models ~match.

If you're in a cluster environment and you are blessed with multiple GPU nodes you can make GPU go brrrr e.g. across 2 nodes like:

```sh
# Run on the first (master) node with example IP 123.456.123.456:
torchrun --nproc_per_node=8 --nnodes=2 --node_rank=0 --master_addr=123.456.123.456 --master_port=1234 train.py
# Run on the worker node:
torchrun --nproc_per_node=8 --nnodes=2 --node_rank=1 --master_addr=123.456.123.456 --master_port=1234 train.py
```

It is a good idea to benchmark your interconnect (e.g. iperf3). In particular, if you don't have Infiniband then also prepend `NCCL_IB_DISABLE=1` to the above launches. Your multinode training will work, but most likely _crawl_. By default checkpoints are periodically written to the `--out_dir`. We can sample from the model by simply `python sample.py`.

Finally, to train on a single GPU simply run the `python train.py` script. Have a look at all of its args, the script tries to be very readable, hackable and transparent. You'll most likely want to tune a number of those variables depending on your needs.

## baselines

OpenAI GPT-2 checkpoints allow us to get some baselines in place for openwebtext. We can get the numbers as follows:

```sh
$ python train.py config/eval_gpt2.py
$ python train.py config/eval_gpt2_medium.py
$ python train.py config/eval_gpt2_large.py
$ python train.py config/eval_gpt2_xl.py
```

and observe the following losses on train and val:

| model | params | train loss | val loss |
| ------| ------ | ---------- | -------- |
| gpt2 | 124M         | 3.11  | 3.12     |
| gpt2-medium | 350M  | 2.85  | 2.84     |
| gpt2-large | 774M   | 2.66  | 2.67     |
| gpt2-xl | 1558M     | 2.56  | 2.54     |

However, we have to note that GPT-2 was trained on (closed, never released) WebText, while OpenWebText is just a best-effort open reproduction of this dataset. This means there is a dataset domain gap. Indeed, taking the GPT-2 (124M) checkpoint and finetuning on OWT directly for a while reaches loss down to ~2.85. This then becomes the more appropriate baseline w.r.t. reproduction.

## finetuning

Finetuning is no different than training, we just make sure to initialize from a pretrained model and train with a smaller learning rate. For an example of how to finetune a GPT on new text go to `data/shakespeare` and run `prepare.py` to download the tiny shakespeare dataset and render it into a `train.bin` and `val.bin`, using the OpenAI BPE tokenizer from GPT-2. Unlike OpenWebText this will run in seconds. Finetuning can take very little time, e.g. on a single GPU just a few minutes. Run an example finetuning like:

```sh
python train.py config/finetune_shakespeare.py
```

This will load the config parameter overrides in `config/finetune_shakespeare.py` (I didn't tune them much though). Basically, we initialize from a GPT2 checkpoint with `init_from` and train as normal, except shorter and with a small learning rate. If you're running out of memory try decreasing the model size (they are `{'gpt2', 'gpt2-medium', 'gpt2-large', 'gpt2-xl'}`) or possibly decreasing the `block_size` (context length). The best checkpoint (lowest validation loss) will be in the `out_dir` directory, e.g. in `out-shakespeare` by default, per the config file. You can then run the code in `sample.py --out_dir=out-shakespeare`:

```
THEODORE:
Thou shalt sell me to the highest bidder: if I die,
I sell thee to the first; if I go mad,
I sell thee to the second; if I
lie, I sell thee to the third; if I slay,
I sell thee to the fourth: so buy or sell,
I tell thee again, thou shalt not sell my
possession.

JULIET:
And if thou steal, thou shalt not sell thyself.

THEODORE:
I do not steal; I sell the stolen goods.

THEODORE:
Thou know'st not what thou sell'st; thou, a woman,
Thou art ever a victim, a thing of no worth:
Thou hast no right, no right, but to be sold.
```

Whoa there, GPT, entering some dark place over there. I didn't really tune the hyperparameters in the config too much, feel free to try!

## sampling / inference

Use the script `sample.py` to sample either from pre-trained GPT-2 models released by OpenAI, or from a model you trained yourself. For example, here is a way to sample from the largest available `gpt2-xl` model:

```sh
python sample.py \
    --init_from=gpt2-xl \
    --start="What is the answer to life, the universe, and everything?" \
    --num_samples=5 --max_new_tokens=100
```

If you'd like to sample from a model you trained, use the `--out_dir` to point the code appropriately. You can also prompt the model with some text from a file, e.g. ```python sample.py --start=FILE:prompt.txt```.

## efficiency notes

For simple model benchmarking and profiling, `bench.py` might be useful. It's identical to what happens in the meat of the training loop of `train.py`, but omits much of the other complexities.

Note that the code by default uses [PyTorch 2.0](https://pytorch.org/get-started/pytorch-2.0/). At the time of writing (Dec 29, 2022) this makes `torch.compile()` available in the nightly release. The improvement from the one line of code is noticeable, e.g. cutting down iteration time from ~250ms / iter to 135ms / iter. Nice work PyTorch team!

## todos

- Investigate and add FSDP instead of DDP
- Eval zero-shot perplexities on standard evals (e.g. LAMBADA? HELM? etc.)
- Finetune the finetuning script, I think the hyperparams are not great
- Schedule for linear batch size increase during training
- Incorporate other embeddings (rotary, alibi)
- Separate out the optim buffers from model params in checkpoints I think
- Additional logging around network health (e.g. gradient clip events, magnitudes)
- Few more investigations around better init etc.

## troubleshooting

Note that by default this repo uses PyTorch 2.0 (i.e. `torch.compile`). This is fairly new and experimental, and not yet available on all platforms (e.g. Windows). If you're running into related error messages try to disable this by adding `--compile=False` flag. This will slow down the code but at least it will run.

For some context on this repository, GPT, and language modeling it might be helpful to watch my [Zero To Hero series](https://karpathy.ai/zero-to-hero.html). Specifically, the [GPT video](https://www.youtube.com/watch?v=kCc8FmEb1nY) is popular if you have some prior language modeling context.

For more questions/discussions feel free to stop by **#nanoGPT** on Discord:

[![](https://dcbadge.vercel.app/api/server/3zy8kqD9Cp?compact=true&style=flat)](https://discord.gg/3zy8kqD9Cp)

## acknowledgements

All nanoGPT experiments are powered by GPUs on [Lambda labs](https://lambdalabs.com), my favorite Cloud GPU provider. Thank you Lambda labs for sponsoring nanoGPT!
```

### `data/openwebtext/readme.md`

```markdown

## openwebtext dataset

after running `prepare.py` (preprocess) we get:

- train.bin is ~17GB, val.bin ~8.5MB
- train has ~9B tokens (9,035,582,198)
- val has ~4M tokens (4,434,897)

this came from 8,013,769 documents in total.

references:

- OpenAI's WebText dataset is discussed in [GPT-2 paper](https://d4mucfpksywv.cloudfront.net/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
- [OpenWebText](https://skylion007.github.io/OpenWebTextCorpus/) dataset
```

### `data/shakespeare/readme.md`

```markdown

# tiny shakespeare

Tiny shakespeare, of the good old char-rnn fame :)

After running `prepare.py`:

- train.bin has 301,966 tokens
- val.bin has 36,059 tokens
```

### `data/shakespeare_char/readme.md`

```markdown

# tiny shakespeare, character-level

Tiny shakespeare, of the good old char-rnn fame :) Treated on character-level.

After running `prepare.py`:

- train.bin has 1,003,854 tokens
- val.bin has 111,540 tokens
```

### Important image/diagram links

- `README.md` → https://raw.githubusercontent.com/karpathy/nanoGPT/master/assets/nanogpt.jpg
- `README.md` → https://raw.githubusercontent.com/karpathy/nanoGPT/master/assets/gpt2_124M_loss.png
- `README.md` → https://dcbadge.vercel.app/api/server/3zy8kqD9Cp?compact=true&style=flat

## karpathy/micrograd (branch: `master`)

### `README.md`

```markdown

# micrograd

![awww](puppy.jpg)

A tiny Autograd engine (with a bite! :)). Implements backpropagation (reverse-mode autodiff) over a dynamically built DAG and a small neural networks library on top of it with a PyTorch-like API. Both are tiny, with about 100 and 50 lines of code respectively. The DAG only operates over scalar values, so e.g. we chop up each neuron into all of its individual tiny adds and multiplies. However, this is enough to build up entire deep neural nets doing binary classification, as the demo notebook shows. Potentially useful for educational purposes.

### Installation

```bash
pip install micrograd
```

### Example usage

Below is a slightly contrived example showing a number of possible supported operations:

```python
from micrograd.engine import Value

a = Value(-4.0)
b = Value(2.0)
c = a + b
d = a * b + b**3
c += c + 1
c += 1 + c + (-a)
d += d * 2 + (b + a).relu()
d += 3 * d + (b - a).relu()
e = c - d
f = e**2
g = f / 2.0
g += 10.0 / f
print(f'{g.data:.4f}') # prints 24.7041, the outcome of this forward pass
g.backward()
print(f'{a.grad:.4f}') # prints 138.8338, i.e. the numerical value of dg/da
print(f'{b.grad:.4f}') # prints 645.5773, i.e. the numerical value of dg/db
```

### Training a neural net

The notebook `demo.ipynb` provides a full demo of training an 2-layer neural network (MLP) binary classifier. This is achieved by initializing a neural net from `micrograd.nn` module, implementing a simple svm "max-margin" binary classification loss and using SGD for optimization. As shown in the notebook, using a 2-layer neural net with two 16-node hidden layers we achieve the following decision boundary on the moon dataset:

![2d neuron](moon_mlp.png)

### Tracing / visualization

For added convenience, the notebook `trace_graph.ipynb` produces graphviz visualizations. E.g. this one below is of a simple 2D neuron, arrived at by calling `draw_dot` on the code below, and it shows both the data (left number in each node) and the gradient (right number in each node).

```python
from micrograd import nn
n = nn.Neuron(2)
x = [Value(1.0), Value(-2.0)]
y = n(x)
dot = draw_dot(y)
```

![2d neuron](gout.svg)

### Running tests

To run the unit tests you will have to install [PyTorch](https://pytorch.org/), which the tests use as a reference for verifying the correctness of the calculated gradients. Then simply:

```bash
python -m pytest
```

### License

MIT
```

### Important image/diagram links

- `README.md` → https://raw.githubusercontent.com/karpathy/micrograd/master/puppy.jpg
- `README.md` → https://raw.githubusercontent.com/karpathy/micrograd/master/moon_mlp.png
- `README.md` → https://raw.githubusercontent.com/karpathy/micrograd/master/gout.svg

## karpathy/llm.c (branch: `master`)

### `README.md`

```markdown
# llm.c

LLMs in simple, pure C/CUDA with no need for 245MB of PyTorch or 107MB of cPython. Current focus is on pretraining, in particular reproducing the [GPT-2](https://github.com/openai/gpt-2) and [GPT-3](https://arxiv.org/abs/2005.14165) miniseries, along with a parallel PyTorch reference implementation in [train_gpt2.py](train_gpt2.py). You'll recognize this file as a slightly tweaked [nanoGPT](https://github.com/karpathy/nanoGPT), an earlier project of mine. Currently, llm.c is a bit faster than PyTorch Nightly (by about 7%). In addition to the bleeding edge mainline code in [train_gpt2.cu](train_gpt2.cu), we have a simple reference CPU fp32 implementation in ~1,000 lines of clean code in one file [train_gpt2.c](train_gpt2.c). I'd like this repo to only maintain C and CUDA code. Ports to other languages or repos are very welcome, but should be done in separate repos, and I am happy to link to them below in the "notable forks" section. Developer coordination happens in the [Discussions](https://github.com/karpathy/llm.c/discussions) and on Discord, either the `#llmc` channel on the [Zero to Hero](https://discord.gg/3zy8kqD9Cp) channel, or on `#llmdotc` on [GPU MODE](https://discord.gg/gpumode) Discord.

## quick start

The best introduction to the llm.c repo today is reproducing the GPT-2 (124M) model. [Discussion #481](https://github.com/karpathy/llm.c/discussions/481) steps through this in detail. We can reproduce other models from the GPT-2 and GPT-3 series in both llm.c and in the parallel implementation of PyTorch. Have a look at the [scripts README](scripts/README.md).

debugging tip: when you run the `make` command to build the binary, modify it by replacing `-O3` with `-g` so you can step through the code in your favorite IDE (e.g. vscode).

## quick start (1 GPU, fp32 only)

If you won't be training on multiple nodes, aren't interested in mixed precision, and are interested in learning CUDA, the fp32 (legacy) files might be of interest to you. These are files that were "checkpointed" early in the history of llm.c and frozen in time. They are simpler, more portable, and possibly easier to understand. Run the 1 GPU, fp32 code like this:

```bash
chmod u+x ./dev/download_starter_pack.sh
./dev/download_starter_pack.sh
make train_gpt2fp32cu
./train_gpt2fp32cu
```

The download_starter_pack.sh script is a quick & easy way to get started and it downloads a bunch of .bin files that help get you off the ground. These contain: 1) the GPT-2 124M model saved in fp32, in bfloat16, 2) a "debug state" used in unit testing (a small batch of data, and target activations and gradients), 3) the GPT-2 tokenizer, and 3) the tokenized [tinyshakespeare](https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt) dataset. Alternatively, instead of running the .sh script, you can re-create these artifacts manually as follows:

```bash
pip install -r requirements.txt
python dev/data/tinyshakespeare.py
python train_gpt2.py
```

## quick start (CPU)

The "I am so GPU poor that I don't even have one GPU" section. You can still enjoy seeing llm.c train! But you won't go too far. Just like the fp32 version above, the CPU version is an even earlier checkpoint in the history of llm.c, back when it was just a simple reference implementation in C. For example, instead of training from scratch, you can finetune a GPT-2 small (124M) to output Shakespeare-like text, as an example:

```bash
chmod u+x ./dev/download_starter_pack.sh
./dev/download_starter_pack.sh
make train_gpt2
OMP_NUM_THREADS=8 ./train_gpt2
```

If you'd prefer to avoid running the starter pack script, then as mentioned in the previous section you can reproduce the exact same .bin files and artifacts by running `python dev/data/tinyshakespeare.py` and then `python train_gpt2.py`.

The above lines (1) download an already tokenized [tinyshakespeare](https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt) dataset and download the GPT-2 (124M) weights, (3) init from them in C and train for 40 steps on tineshakespeare with AdamW (using batch size 4, context length only 64), evaluate validation loss, and sample some text. Honestly, unless you have a beefy CPU (and can crank up the number of OMP threads in the launch command), you're not going to get that far on CPU training LLMs, but it might be a good demo/reference. The output looks like this on my MacBook Pro (Apple Silicon M3 Max):

```
[GPT-2]
max_seq_len: 1024
vocab_size: 50257
num_layers: 12
num_heads: 12
channels: 768
num_parameters: 124439808
train dataset num_batches: 1192
val dataset num_batches: 128
num_activations: 73323776
val loss 5.252026
step 0: train loss 5.356189 (took 1452.121000 ms)
step 1: train loss 4.301069 (took 1288.673000 ms)
step 2: train loss 4.623322 (took 1369.394000 ms)
step 3: train loss 4.600470 (took 1290.761000 ms)
... (trunctated) ...
step 39: train loss 3.970751 (took 1323.779000 ms)
val loss 4.107781
generating:
---
Come Running Away,
Greater conquer
With the Imperial blood
the heaviest host of the gods
into this wondrous world beyond.
I will not back thee, for how sweet after birth
Netflix against repounder,
will not
flourish against the earlocks of
Allay
---
```

## datasets

The data files inside `/dev/data/(dataset).py` are responsible for downloading, tokenizing and saving the tokens to .bin files, readable easily from C. So for example when you run:

```bash
python dev/data/tinyshakespeare.py
```

We download and tokenize the [tinyshakespeare](https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt) dataset. The output of this looks like this:

```
writing 32,768 tokens to ./dev/data/tinyshakespeare/tiny_shakespeare_val.bin
writing 305,260 tokens to ./dev/data/tinyshakespeare/tiny_shakespeare_train.bin
```

The .bin files contain a short header (1024 bytes) and then a stream of tokens in uint16, indicating the token ids with the GPT-2 tokenizer. More datasets are available in `/dev/data`.

## test

I am also attaching a simple unit test for making sure our C code agrees with the PyTorch code. On the CPU as an example, compile and run with:

```bash
make test_gpt2
./test_gpt2
```

This now loads the `gpt2_124M_debug_state.bin` file that gets written by train_gpt2.py, runs a forward pass, compares the logits and loss with the PyTorch reference implementation, then it does 10 iterations of training with Adam and makes sure the losses match PyTorch. To test the GPU version we run:

```bash
# fp32 test (cudnn not supported)
make test_gpt2cu PRECISION=FP32 && ./test_gpt2cu
# mixed precision cudnn test
make test_gpt2cu USE_CUDNN=1 && ./test_gpt2cu
```

This tests both the fp32 path and the mixed precision path. The test should pass and print `overall okay: 1`.

## tutorial

I attached a very small tutorial here, in [doc/layernorm/layernorm.md](doc/layernorm/layernorm.md). It's a simple, step-by-step guide to implementing a single layer of the GPT-2 model, the layernorm layer. This is a good starting point to understand how the layers are implemented in C.

**flash attention**. As of May 1, 2024 we use the Flash Attention from cuDNN. Because cuDNN bloats the compile time from a few seconds to ~minute and this code path is right now very new, this is disabled by default. You can enable it by compiling like this:

```bash
make train_gpt2cu USE_CUDNN=1
```

This will try to compile with cudnn and run it. You have to have cuDNN installed on your system. The [cuDNN installation instructions](https://developer.nvidia.com/cudnn) with apt-get will grab the default set of cuDNN packages. For a minimal setup, the cuDNN dev package is sufficient, e.g. on Ubuntu 22.04 for CUDA 12.x:

```bash
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install libcudnn9-dev-cuda-12
```

On top of this you need the [cuDNN frontend](https://github.com/NVIDIA/cudnn-frontend/tree/main), but this is just header files. Simply clone the repo to your disk. The Makefile currently looks for it in either your home directory or the current directory. If you have put it elsewhere, add `CUDNN_FRONTEND_PATH=/path/to/your/cudnn-frontend/include` to the `make` command-line.

## multi-GPU training

Make sure you install MPI and NCCL, e.g. on Linux:

```bash
sudo apt install openmpi-bin openmpi-doc libopenmpi-dev
```

For NCCL follow the instructions from the [official website](https://developer.nvidia.com/nccl/nccl-download) (e.g. network installer)

and then:

```bash
make train_gpt2cu
mpirun -np <number of GPUs> ./train_gpt2cu
```

or simply run one of our scripts under `./scripts/`.

## multi-node training

Make sure you've installed `NCCL` following instructions from [multi-GPU](#multi-gpu-training) section.

There are 3 ways we currently support that allow you to run multi-node training:
1) Use OpenMPI to exchange nccl id and initialize NCCL. See e.g. `./scripts/multi_node/run_gpt2_124M_mpi.sh` script for details.
2) Use shared file system to init NCCL. See `./scripts/multi_node/run_gpt2_124M_fs.sbatch` script for details.
3) Use TCP sockets to init NCCL. See `./scripts/multi_node/run_gpt2_124M_tcp.sbatch` script for details.

Note:
* If you're running in a slurm environment and your slurm doesn't support PMIx (which we assume will be a common situation given that `slurm-wlm` dropped PMIx support) you will have to use FS (2) or TCP (3) approach. To test whether your slurm supports PMIx run: `srun --mpi=list` and see whether you get `pmix` in the output.
* If you don't have slurm set up, you can kick off a multi-node run using `mpirun` - MPI (1).

None of these 3 methods is superior, we just offer you options so that you can run in your specific environment.

## experiments / sweeps

Just as an example process to sweep learning rates on a machine with 4 GPUs on TinyStories. Run a shell script `sweep.sh` (after you of course `chmod u+x sweep.sh`):

```bash
#!/bin/bash

learning_rates=(3e-5 1e-4 3e-4 1e-3)

for i in {0..3}; do
    export CUDA_VISIBLE_DEVICES=$i
    screen -dmS "tr$i" bash -c "./train_gpt2cu -i data/TinyStories -v 250 -s 250 -g 144 -l ${learning_rates[$i]} -o stories$i.log"
done

# you can bring these down with
# screen -ls | grep -E "tr[0-3]" | cut -d. -f1 | xargs -I {} screen -X -S {} quit
```

This example opens up 4 screen sessions and runs the four commands with different LRs. This writes the log files `stories$i.log` with all the losses, which you can plot as you wish in Python. A quick example of how to parse and plot these logfiles is in [dev/vislog.ipynb](dev/vislog.ipynb).

## repo

A few more words on what I want this repo to be:

First, I want `llm.c` to be a place for education. E.g. our `dev/cuda` folder is a place for a library of kernels for all the layers that are manually hand-written and very well documented, starting from very simple kernels all the way to more complex / faster kernels. If you have a new kernel with various different tradeoffs, please feel free to contribute it here.

That said, I also want `llm.c` to be very fast too, even practically useful to train networks. E.g. to start, we should be able to reproduce the big GPT-2 (1.6B) training run. This requires that we incorporate whatever fastest kernels there are, including the use of libraries such as cuBLAS, cuBLASLt, CUTLASS, cuDNN, etc. I also think doing so serves an educational purpose to establish an expert upper bound, and a unit of measurement, e.g. you could say that your manually written kernels are 80% of cuBLAS speed, etc. Then you can choose to do a super fast run, or you can choose to "drag and drop" whatever manual kernels you wish to use, and run with those.

However, as a constraint, I want to keep the mainline `llm.c` in the root folder simple and readable. If there is a PR that e.g. improves performance by 2% but it "costs" 500 lines of complex C code, and maybe an exotic 3rd party dependency, I may reject the PR because the complexity is not worth it. As a concrete example - making cuBLAS for matmuls the default in the root training loop is a no-brainer: it makes the mainline code much faster, it is a single line of interpretable code, and it is a very common dependency. On the side of this, we can have manual implementations that can compete with cuBLAS in `dev/cuda`.

Lastly, I will be a lot more sensitive to complexity in the root folder of the project, which contains the main / default files of the project. In comparison, the `dev/` folder is a bit more of a scratch space for us to develop a library of kernels or classes and share useful or related or educational code, and some of this code could be ok to be (locally) complex.

## notable forks

- AMD support
  - [llm.c](https://github.com/anthonix/llm.c) by @[anthonix](https://github.com/anthonix): support for AMD devices, such as the 7900 XTX

- C#
  - [llm.cs](https://github.com/azret/llm.cs) by @[azret](https://github.com/azret): a C# port of this project
  - [Llm.cs](https://github.com/nietras/Llm.cs) by @[nietras](https://github.com/nietras): a C# port of this project with focus on easy to get started on any platform. Clone and run ✅

- CUDA C++
  - [llm.cpp](https://github.com/gevtushenko/llm.c) by @[gevtushenko](https://github.com/gevtushenko): a port of this project using the [CUDA C++ Core Libraries](https://github.com/NVIDIA/cccl)
     - A presentation this fork was covered in [this lecture](https://www.youtube.com/watch?v=WiB_3Csfj_Q) in the [GPU MODE Discord Server](https://discord.gg/cudamode)

- C++/CUDA
  - [llm.cpp](https://github.com/zhangpiu/llm.cpp/tree/master/llmcpp) by @[zhangpiu](https://github.com/zhangpiu): a port of this project using the [Eigen](https://gitlab.com/libeigen/eigen), supporting CPU/CUDA.

- WebGPU C++
  - [gpu.cpp](https://github.com/AnswerDotAI/gpu.cpp) by @[austinvhuang](https://github.com/austinvhuang): a library for portable GPU compute in C++ using native WebGPU. Aims to be a general-purpose library, but also porting llm.c kernels to WGSL.
  
- C++
  - [llm.cpp](https://github.com/GaoYusong/llm.cpp) by @[GaoYusong](https://github.com/GaoYusong): a port of this project featuring a C++ single-header [tinytorch.hpp](https://github.com/GaoYusong/llm.cpp/blob/main/tinytorch.hpp) library

- Go
  - [llm.go](https://github.com/joshcarp/llm.go) by @[joshcarp](https://github.com/joshcarp): a Go port of this project

- Java
  - [llm.java](https://github.com/harryjackson/llm.java) by @[harryjackson](https://github.com/harryjackson): a Java port of this project

- Metal
  - [llm.metal](https://github.com/regrettable-username/llm.metal) by @[regrettable-username](https://github.com/regrettable-username): LLM training in simple, raw C/Metal Shading Language

- Mojo
  - [llm.🔥](https://github.com/dorjeduck/llm.mojo) by @[dorjeduck](https://github.com/dorjeduck): a Mojo port of this project

- OpenCL
  - [llm.c](https://github.com/krrishnarraj/llm.c) by @[krrishnarraj](https://github.com/krrishnarraj): an OpenCL port of this project

- Rust
  -  [llm.rs](https://github.com/yijunyu/llm.rs) by @[Yijun Yu](https://github.com/yijunyu): a Rust rewrite with the aim to have same performance
  -  [llm.rs](https://github.com/ToJen/llm.rs) by @[ToJen](https://github.com/ToJen): a Rust port of this project

- Swift
  - [llm.swift](https://github.com/otabuzzman/llm.swift) by @[otabuzzman](https://github.com/otabuzzman): a Swift port of this project

- Zig
  - [llm.zig](https://github.com/Saimirbaci/llm.zig) by @[saimirbaci](https://github.com/Saimirbaci): a Zig port of this project
 
- Habana Gaudi2
  - [llm.tpc](https://github.com/abhilash1910/llm.tpc) by @[abhilash1910](https://github.com/abhilash1910): a Habana Gaudi2 port of this project 

- Nim
  - [llm.nim](https://github.com/Vindaar/llm.nim) by @[Vindaar](https://github.com/Vindaar): a Nim port of this project

## discussions

Ways of organizing development:

- Experiencing a concrete issue with the repo? Use [Issues](https://github.com/karpathy/llm.c/issues).
- Have some code to contribute? Open a [PR](https://github.com/karpathy/llm.c/pulls)
- Chat about the repo, ask questions, etc.? Look at [Discussions](https://github.com/karpathy/llm.c/discussions).
- Something faster? I created a new `#llmc` channel on my [Zero to Hero Discord channel](https://discord.gg/3zy8kqD9Cp).

## license

MIT
```

### `dev/cuda/README.md`

```markdown
# dev/cuda

This directory is scratch space for developing various versions of the needed CUDA kernels. Each file develops a kernel, and usually multiple versions of that kernel that could have different running times and of different code or time complexity.

See the top of each file for how to compile and run the kernel. Alternatively, the commands are also all grouped in the `Makefile` in this directory for convenience.

For example, we can look at the top of `layernorm_forward.cu` to build the forward pass kernels for the LayerNorm:

```bash
nvcc -O3 --use_fast_math -lcublas -lcublasLt layernorm_forward.cu -o layernorm_forward
```

or simply

```bash
make layernorm_forward
```

The comments at the top then document the different versions of this kernel available, usually these are in increasing complexity and decreasing running times. For example, inspecting the comments in the file on top, the most naive kernel we can then run as:

```bash
./layernorm_forward 1
```

You'll see that this first forwards the reference code on the CPU, then it runs kernel 1 on the GPU, compares the results to check for correctness, and then runs a number of configurations of this kernel (most often and most notably the block size), to time the kernel in these launch configurations. We can then run one of the faster kernels (kernel 4) instead:

```bash
./layernorm_forward 4
```

You'll see that this matches all the CPU results but runs much much faster. The typical process from here on is we copy paste the kernel that ran fastest, adjust it manually (e.g. to hardcode the best block size) and drop it into the training code file, e.g. `train_gpt2.cu`.

To add a new version of a kernel, add the kernel to the corresponding file and adjust the docs. To add a new kernel, add the new file and adjust the Makefile. Run `make clean` to clean up binaries from your directory.

If you do not have a GPU or is having trouble with CUDA dependencies, you can run the benchmarks on the [Modal platform](http://modal.com). For example, to run the benchmark for the attention forward pass on an A100 GPU with 80GB of memory, you can run the following command:

```bash
GPU_MEM=80 modal run benchmark_on_modal.py --compile-command "nvcc -O3 --use_fast_math attention_forward.cu -o attention_forward -lcublas" --run-command "./attention_forward 1"
```
```

### `dev/data/README.md`

```markdown
# dev/data organization

The idea is that each dataset has a .py file here in the root of `dev/data`, and each dataset then creates a directory here, and writes and caches anything inside that directory. So for example:

- running `python tinystories.py` will create a directory `tinystories` with its .bin files inside it
- running `python tinyshakespeare.py` will create a directory `tinyshakespeare` with its .bin files inside it

And so on. This way we can nicely organize multiple datasets here, share common utilities between them, and then point the .py/.c code in the root of the project accordingly to these.

Note: we support "gpt-2" and "llama" (llama 3 in particular) models and the above scripts will tokenize gpt-2 by default.
```

### `dev/eval/README.md`

```markdown
# eleuther eval readme

The goal here is to run the Eleuther Eval harness exactly in the same way as that used in the [huggingface LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard).

The starting point is a `.bin` file trained by llm.c. We now have to export it to a huggingface model and then evaluate it.

To export the model, use [export_hf.py](export_hf.py). See its documentation up top. Eample usage, from this directory:

```bash
cd dev/eval
python export_hf.py --input model.bin --output output_dir
```

Where you point to your model .bin file, and huggingface files get written to output_dir. The script can optionally also upload to huggingface hub. One more post-processing that is advisable is to go into the `output_dir`, open up the `config.json` there and add one more entry into the json object:

```
"_attn_implementation": "flash_attention_2"
```

To use FlashAttention 2. We had trouble evaluating in bfloat16 without using FlashAttention 2 (the scores are much lower, and this was never fully resolved). This is a temporary hack/workaround.

Now that we have the model in huggingface format, we download the Eleuther Eval Harness repo and run it. Head over to the parent/root directory of the llm.c repo and:

```bash
git clone https://github.com/EleutherAI/lm-evaluation-harness/
cd lm-evaluation-harness
git checkout b281b0921b636bc36ad05c0b0b0763bd6dd43463
pip install -e .
```

And then run the run_eval.sh script:

```bash
./dev/eval/run_eval.sh output_dir result_dir
```

Where output_dir can either be local output dir (above), or a huggingface repo name.This will write eval json objects to `./lm-evaluation-harness/results/results_dir`. It will print the results into console, e.g. for a 774M model we see:

```
----------------------------------------
arc_challenge_25shot.json      : 30.4608
gsm8k_5shot.json               : 0.1516
hellaswag_10shot.json          : 57.8072
mmlu_5shot.json                : 25.8682
truthfulqa_0shot.json          : 35.7830
winogrande_5shot.json          : 59.3528
----------------------------------------
Average Score                  : 34.9039
```

But you can additionally get these results later by running `summarize_eval.py`:

```bash
python dev/eval/summarize_eval.py lm-evaluation-harness/results/results_dir
```

The same information will be printed again.

For some reason, the evaluation is quite expensive and runs for somewhere around 1-3 hours, even though it should be a few minutes at most. This has not been satisfyingly resolved so far.
```

### `scripts/README.md`

```markdown
# scripts

These shell scripts hold the exact commands to llm.c that reproduce the GPT-2 and GPT-3 runs.

### pytorch reference runs

For all pyrun scripts, current restrictions:

- does not write checkpoint, only logs of the train/val losses
- does not evaluate hellaswag accuracy
- cannot "resume training" (i.e. the `-y 1` flag)

### memory considerations

In any of these scripts, if you are running out of memory on your GPU you'll want to meddle with two flags: the recompute setting `-r` and the microbatch size `-b`. Recompute throws away some activations during the forward pass and then recomputes them during the backward pass. This reduces the amount of memory we need to store and cache during the forward pass, but then increases the amount of computation we need to do during the backward pass. The microbatch size controls the number of token streams that are processed in a single forward/backward pass in parallel. Decreasing this number means we need to store less memory per microbatch, but then we have to increase the number of loops in the gradient accumulation to meet the same desired total batch size.

Long story short, try `-r 1` (recompute GeLU, trading off speed and memory) to conserve some memory. If that doesn't help, start dividing the micro batch size until things fit. For example if the deafult is `-b 64`, try `-b 32`, and then 16, 8, etc. until things fit. Once they do fit, experiment with dialing back the recompute flag `-r 0` to get some speed back. Alternatively to `-b`, if your application doesn't need a very long context length, you can dial back the number of max sequence length using `-t`. For example GPT-2 uses `-t 1024` and GPT-3 uses `-t 2048`. Your application may tolerate a lower context length.

### multi-gpu considerations

It might be that you only have one GPU and not a whole box of them. Every script is fairly easy to change for just a single GPU. For llm.c, simply change line 1 to line 2 and leave everything else the same:

```bash
mpirun -np 8 ./train_gpt2cu \
./train_gpt2cu \
```

For PyTorch, the same thing:

```bash
torchrun --standalone --nproc_per_node=8 train_gpt2.py \
python train_gpt2.py \
```

Both of these scripts automatically detect how many GPUs are available and adjust the gradient accumulation inner loop of the optimization accordingly, so the results come out the same, up to floating point error. Of course, you'll have to wait proportionally longer for the optimization to finish.

To run on multiple nodes of GPUs, have a look at this pending [PR](https://github.com/karpathy/llm.c/pull/426), alternatively for llm.c try something like this:

```bash
mpirun -np 16 --host node1:8,node2:8 ./train_gptcu ...
```

For PyTorch follow the torchrun docs.
```

### `doc/layernorm/layernorm.md`

```markdown

# layernorm

Quick tutorial. Let's look at how LayerNorm is handled, as one example layer in the model. We start with the [PyTorch docs for LayerNorm](https://pytorch.org/docs/stable/generated/torch.nn.LayerNorm.html). LayerNorm of course comes from this original paper by [Ba et al. 2016](https://arxiv.org/abs/1607.06450), and was incorporated into the Transformer in [Vaswani et al.](https://arxiv.org/abs/1706.03762) famous paper Attention is All You Need. [GPT-2](https://d4mucfpksywv.cloudfront.net/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) picked up the same architecture as the Transformer, but the position of the LayerNorm was famously moved into what is now called the pre-normalization version. That is, the residual path of the Transformer is kept clean, and the LayerNorms are now the first layer of each block of the Transformer. This positively improves training stability.

The first thing to note when looking at [PyTorch LayerNorm](https://pytorch.org/docs/stable/generated/torch.nn.LayerNorm.html) is that you will most likely not be able to find the actual implementation of the equation. That's because it is buried 30 layers deep in the code, behind an inscrutable dynamical dispatcher, in some possibly auto-generated CUDA code (for those who are interested in details, see [layer_norm.cpp](https://github.com/pytorch/pytorch/blob/main/aten/src/ATen/native/layer_norm.cpp) and  [layer_norm_kernel.cu](https://github.com/pytorch/pytorch/blob/main/aten/src/ATen/native/cuda/layer_norm_kernel.cu)). This is done because PyTorch really really cares about efficiency, fair enough. For our purposes though, we have to start by first implementing LayerNorm manually using simpler PyTorch operations. This will be a lot less efficient than just forwarding a `LayerNorm` module, but it is algorithmically instructive. So here is the direct implementation of the math of LayerNorm using simpler PyTorch operations:

```python
import torch
eps = 1e-5

class LayerNorm:

    @staticmethod
    def forward(x, w, b):
        # x is the input activations, of shape B,T,C
        # w are the weights, of shape C
        # b are the biases, of shape C
        B, T, C = x.size()
        # calculate the mean
        mean = x.sum(-1, keepdim=True) / C # B,T,1
        # calculate the variance
        xshift = x - mean # B,T,C
        var = (xshift**2).sum(-1, keepdim=True) / C # B,T,1
        # calculate the inverse standard deviation: **0.5 is sqrt, **-0.5 is 1/sqrt
        rstd = (var + eps) ** -0.5 # B,T,1
        # normalize the input activations
        norm = xshift * rstd # B,T,C
        # scale and shift the normalized activations at the end
        out = norm * w + b # B,T,C

        # return the output and the cache, of variables needed later during the backward pass
        cache = (x, w, mean, rstd)
        return out, cache
```

The activation tensors in the residual path of the Transformer during training are 3-dimensional arrays (tensors), of shape `B,T,C`. B is the batch size, T is time, and C is channels. For example, B=8, T=1024, C=768 is one setting you might see, for the smallest (124 million parameter) GPT-2 model.

We can forward this layer with some random numbers:

```python
B = 2 # some toy numbers here
T = 3
C = 4
x = torch.randn(B, T, C, requires_grad=True)
w = torch.randn(C, requires_grad=True)
b = torch.randn(C, requires_grad=True)
out, cache = LayerNorm.forward(x, w, b)
```

What we get out is the tensor `out`, also of shape `B,T,C`, where each C-dimensional "fibre" of activations (as we call them) is normalized and then scaled and at the end also shifted by the weights and biases of this layer. Notice that, importantly, we also return a variable `cache`, which is a tuple of the input activations `x`, the weights `w`, the mean `mean`, and the reciprocal standard deviation `rstd`. These are all variables we need during the backward pass.

PyTorch can of course do the backward pass of this layer for us with its Autograd. Let's do that first:

```python
dout = torch.randn(B, T, C)
fakeloss = (out * dout).sum()
fakeloss.backward()
```

You see here that we created a `fakeloss`, which simply takes a (random) weighted combination of all the outputs of our layernorm. All this is doing is projecting all of the `B,T,C` numbers into a single scalar value (loss), so that we have a single output of our "computational graph". Typically this would be the loss of the model, but here we're just doing a fake loss. We then call `backward()` on this scalar, and PyTorch will compute all the gradients for us on all the inputs to this graph - i.e. the input activations `x`, the weights `w`, and the biases `b`. If you don't know too much about autograd, I'd encourage you to watch my [micrograd](https://www.youtube.com/watch?v=VMj-3S1tku0) video, where we build a tiny autograd engine. So the magic of PyTorch autograd is that after we call `.backward`, it will populate the `.grad` attribute of all the tensors that have `requires_grad=True` with the gradients of the loss with respect to that tensor. These gradients are telling us the slope of the loss for all of the input numbers in x,w,b. Therefore, the shape of `x.grad`, `w.grad`, and `b.grad` are exactly the same as the shape of `x`, `w`, and `b`.

But we don't want to use PyTorch Autograd. We want to do the backward pass manually. So we take out pen and paper and write out the expression for LayerNorm. The forward pass has the following mathematical form:

$\text{LayerNorm}(x) = w \odot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + b$

where $\odot$ is elementwise multiplication, $\mu$ is the mean, $\sigma^2$ is the variance, and $\epsilon$ is a small constant to avoid division by zero. Remembering the rules of differentiation from calculus, we now want to derive the gradients. For this part, my video [Becoming a Backprop Ninja](https://www.youtube.com/watch?v=q8SA3rM6ckI) could be very helpful, as I work through (in detail) a similar layer - the Batch Normalization layer. When you work through the differentiation, you'll notice that the expressions simplify analytically and you can move the terms around and simplify the expression somehwat. So you don't have to manually backward every individual line in the forward pass. In particular, we get:

```python
    @staticmethod
    def backward(dout, cache):
        x, w, mean, rstd = cache
        # recompute the norm (save memory at the cost of compute)
        norm = (x - mean) * rstd
        # gradients for weights, bias
        db = dout.sum((0, 1))
        dw = (dout * norm).sum((0, 1))
        # gradients for input
        dnorm = dout * w
        dx = dnorm - dnorm.mean(-1, keepdim=True) - norm * (dnorm * norm).mean(-1, keepdim=True)
        dx *= rstd
        return dx, dw, db
```

So given the gradients on every individual output number stored in `dout`, and the `cache` from the forward pass, we can now backward through this layer into the inputs, to continue the chain rule of the backward pass. So now we can do our own backward pass and see that they match (the errors are tiny):

```python
dx, dw, db = LayerNorm.backward(dout, cache)
print("dx error:", (x.grad - dx).abs().max().item())
print("dw error:", (w.grad - dw).abs().max().item())
print("db error:", (b.grad - db).abs().max().item())
```

Notice one more thing. Inside the backward pass we recomputed the variable `norm`. We already calculated this variable in the forward pass but then we threw it away! Couldn't we have made this also be a part of the `cache` and save this recompute? Actually, we very well could and you'd of course get the exact same results. The amount of stuff we save into our `cache` is completely up to us. We didn't even have to save `mean` and `rstd` either, and we could have recomputed them in the backward pass. The difference is that `mean` and `rstd` are very small, only of shape `B,T`, where as `norm` is of shape `B,T,C`. So this is simply a tradeoff between memory and compute. By not keeping `norm` in the cache, we are saving memory, but we are trading it off for a bit of compute later in the backward pass. This is very common in all the layers, and you'll see that different implementations of various layers in deep learning frameworks may all have different "checkpointing settings". Yes, confusingly enough, this is called checkpointing and has nothing to do with saving the model weights to disk. It's about saving intermediate variables in the forward pass to save compute in the backward pass.

Okay so that's the version with PyTorch tensors. Now we have to move this to C and get rid of the Tensor abstraction. Before I give you the full implementation of the forward pass, a brief word on Tensors. What are Tensors? They are 1) a 1D block of memory called Storage that holds the raw data, and 2) a View over that storage that holds its shape. [PyTorch Internals](http://blog.ezyang.com/2019/05/pytorch-internals/) could be helpful here. So for example if we have the 3D tensor:

```python
torch.manual_seed(42)
B, T, C = 2, 3, 4
a = torch.randn(B, T, C)
print(a)

tensor([[[ 1.9269,  1.4873,  0.9007, -2.1055],
         [ 0.6784, -1.2345, -0.0431, -1.6047],
         [ 0.3559, -0.6866, -0.4934,  0.2415]],

        [[-1.1109,  0.0915, -2.3169, -0.2168],
         [-0.3097, -0.3957,  0.8034, -0.6216],
         [-0.5920, -0.0631, -0.8286,  0.3309]]])
```

This is 2x3x4 Tensor, but the underlying memory of it is just one single 1D array of size 2\*3\*4=24. The View is just a shape over this 1D array. So now when we index into this PyTorch tensor, for example `a[1,2,3]`, PyTorch computes the offset into the 1D array as `1*3*4 + 2*4 + 3 = 23`, and return the value at that offset. The general formula is that if you want to retrieve any element `b,t,c`, you compute the offset into Storage as `b*T*C + t*C + c`. So for example:

```python
b,t,c = 1,2,3
print(a[b,t,c])
print(a.view(-1)[b*T*C + t*C + c])
```

Both of these print 0.3309. So in this way, we know how to access all the individual elements, and how to offset all the pointers. Notice in particular that the channel dimension is the innermost dimension. So as we increase offset by 1, we are traversing the channel dimension. This is important to consider for the memory layout of our C implementation. The equivalent forward pass in C becomes:

```c
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

void layernorm_forward(float* out, float* mean, float* rstd,
                       float* inp, float* weight, float* bias,
                       int B, int T, int C) {
    float eps = 1e-5f;
    for (int b = 0; b < B; b++) {
        for (int t = 0; t < T; t++) {
            // seek to the input position inp[b,t,:]
            float* x = inp + b * T * C + t * C;
            // calculate the mean
            float m = 0.0f;
            for (int i = 0; i < C; i++) {
                m += x[i];
            }
            m = m/C;
            // calculate the variance (without any bias correction)
            float v = 0.0f;
            for (int i = 0; i < C; i++) {
                float xshift = x[i] - m;
                v += xshift * xshift;
            }
            v = v/C;
            // calculate the rstd
            float s = 1.0f / sqrtf(v + eps);
            // seek to the output position in out[b,t,:]
            float* out_bt = out + b * T * C + t * C;
            for (int i = 0; i < C; i++) {
                float n = (s * (x[i] - m)); // normalized output
                float o = n * weight[i] + bias[i]; // scale and shift it
                out_bt[i] = o; // write
            }
            // cache the mean and rstd for the backward pass later
            mean[b * T + t] = m;
            rstd[b * T + t] = s;
        }
    }
}
```

You'll see how I offset the pointer to the `inp[b,t]`, and then you know that the next `C` elements are the channels of that position in (batch, time). And the backward pass:

```c
void layernorm_backward(float* dinp, float* dweight, float* dbias,
                        float* dout, float* inp, float* weight, float* mean, float* rstd,
                        int B, int T, int C) {
    for (int b = 0; b < B; b++) {
        for (int t = 0; t < T; t++) {
            float* dout_bt = dout + b * T * C + t * C;
            float* inp_bt = inp + b * T * C + t * C;
            float* dinp_bt = dinp + b * T * C + t * C;
            float mean_bt = mean[b * T + t];
            float rstd_bt = rstd[b * T + t];

            // first: two reduce operations
            float dnorm_mean = 0.0f;
            float dnorm_norm_mean = 0.0f;
            for (int i = 0; i < C; i++) {
                float norm_bti = (inp_bt[i] - mean_bt) * rstd_bt;
                float dnorm_i = weight[i] * dout_bt[i];
                dnorm_mean += dnorm_i;
                dnorm_norm_mean += dnorm_i * norm_bti;
            }
            dnorm_mean = dnorm_mean / C;
            dnorm_norm_mean = dnorm_norm_mean / C;

            // now iterate again and accumulate all the gradients
            for (int i = 0; i < C; i++) {
                float norm_bti = (inp_bt[i] - mean_bt) * rstd_bt;
                float dnorm_i = weight[i] * dout_bt[i];
                // gradient contribution to bias
                dbias[i] += dout_bt[i];
                // gradient contribution to weight
                dweight[i] += norm_bti * dout_bt[i];
                // gradient contribution to input
                float dval = 0.0f;
                dval += dnorm_i; // term 1
                dval -= dnorm_mean; // term 2
                dval -= norm_bti * dnorm_norm_mean; // term 3
                dval *= rstd_bt; // final scale
                dinp_bt[i] += dval;
            }
        }
    }
}
```

One additional detail to note is that we always += into the gradients. We never use = and we never use *=. This is important stylistically because if you have one variable used multiple times in a graph, the backward pass gradients always add up. In this repo this is not important because we don't have exotic branching, but it's proper. So during training we always first do `zero_grad` to set all the gradients to zero, and then we accumulate into them during backward pass.

One more note on differences between training and inference. Some of you may have already seen my earlier project [llama2.c](https://github.com/karpathy/llama2.c), which inferences Llama 2 architecture in pure C. Unlike GPT-2, Llama 2 swaps out LayerNorm for the much simpler RMSNorm. You can see the implementation of the [RMSNorm in llama2.c](https://github.com/karpathy/llama2.c/blob/master/run.c#L182), copy pasting it here:

```c
void rmsnorm(float* o, float* x, float* weight, int size) {
    // calculate sum of squares
    float ss = 0.0f;
    for (int j = 0; j < size; j++) {
        ss += x[j] * x[j];
    }
    ss /= size;
    ss += 1e-5f;
    ss = 1.0f / sqrtf(ss);
    // normalize and scale
    for (int j = 0; j < size; j++) {
        o[j] = weight[j] * (ss * x[j]);
    }
}
```

How does this differ to our LayerNorm above?

- First, algorithmically, you'll notice that RMSNorm does not keep track of or subtract the mean, it only normalizes by the norm. Notice: norm, not standard deviation, because we did not subtract the mean. This is a simplification of the layer that has now become very trendy because it works just as well, if not slightly better. Also, the RMSNorm does not have biases, it only has a weight for scaling after normalization. In general, GPT-2 used way too many biases everywhere and it turns out you can remove these - from all the Linear Layers and from LayerNorms. The network can "simulate" biases if it needs them, e.g. by allocating one of the channel dimensions to be constant (data-independent), and then any weight multiplying that constant dimension will effectively work like a bias. This significantly simplies a lot of the code.
- Second, the inference code has no batch dimension B, i.e. the batch size is assumed to be 1. You could in principle have batched inference as well, especially if you wish to host an LLM that you expect many simultaneous queries to. But if you're just running an LLM locally, chances are you just want to have a single "stream" of generation, so there is no batch size for parallelism that could support multiple streams at once. To keep things simple, llama2.c is not batched, and therefore you won't see any loops that look like `for (int b = 0; b < B; b++)`.
- Third, this inference code has no time dimension T within this individual layer. During training, we can loop over time inside each layer and calculate the layernorm at all time steps. But during inference, we have to generate one token at a time, feeding the token predicted at time `t` into the forward pass of the Transformer at the next time step `t+1`. So this is why you don't see any loops that look like `for (int t = 0; t < T; t++)` inside individual layers. This loop over time [does exist](https://github.com/karpathy/llama2.c/blob/master/run.c#L747), but it is on the outside of the Transformer forward pass.
- You'll see that we don't keep track of any intermediate calculations, memory, or cache. That's because during inference, there is no `.backward` pass that will follow. We only need to calculate the output, and we don't need to keep any intermediate variables around. As a result, the memory consumption of inference is significantly lower than that of training. We can afford to just discard activations, and only keep memory for the "activation frontier". Similarly, there is no need to implement the `backward` function for this RMSNorm anywhere, as there is no backward pass.

As a result of all these difference, training is significantly more complex and involved, both algorithmically and computationally, and that's partly why I started by writing inference (llama2.c) before I implemented training (llm.c, here). Finally, I am attaching two helper files to this same directory that have the complete code. First:

```
python layernorm.py
```

To write out the reference data from PyTorch. Then compile and run the C version:

```
gcc layernorm.c -o layernorm -lm
./layernorm
```

You'll see that everything matches ok.

This was just the LayerNorm. We go through the exact same process for all the other layers. Most of the other layers are actually easier than LayerNorm. Hope that helps!
```

## karpathy/llama2.c (branch: `master`)

### `README.md`

```markdown
## llama2.c

<p align="center">
  <img src="assets/llama_cute.jpg" width="300" height="300" alt="Cute Llama">
</p>

Have you ever wanted to inference a baby [Llama 2](https://ai.meta.com/llama/) model in pure C? No? Well, now you can!

Train the Llama 2 LLM architecture in PyTorch then inference it with one simple 700-line C file ([run.c](run.c)). You might think that you need many billion parameter LLMs to do anything useful, but in fact very small LLMs can have surprisingly strong performance if you make the domain narrow enough (ref: [TinyStories](https://huggingface.co/datasets/roneneldan/TinyStories) paper). This repo is a "fullstack" train + inference solution for Llama 2 LLM, with focus on minimalism and simplicity.

As the architecture is identical, you can also load and inference Meta's Llama 2 models. However, the current code only inferences models in fp32, so you will most likely not be able to productively load models larger than 7B. Work on model quantization is currently ongoing.

Please note that this repo started recently as a fun weekend project: I took my earlier [nanoGPT](https://github.com/karpathy/nanoGPT), tuned it to implement the Llama-2 architecture instead of GPT-2, and the meat of it was writing the C inference engine in [run.c](run.c). So the project is young and moving quickly. Hat tip to the awesome [llama.cpp](https://github.com/ggerganov/llama.cpp) for inspiring this project. Compared to llama.cpp, I wanted something super simple, minimal, and educational so I chose to hard-code the Llama 2 architecture and just roll one inference file of pure C with no dependencies.

## feel the magic

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/karpathy/llama2.c/blob/master/run.ipynb)

First, navigate to the folder where you keep your projects and clone this repository to this folder:

```bash
git clone https://github.com/karpathy/llama2.c.git
```

Then, open the repository folder:

```bash
cd llama2.c
```

Now, let's just run a baby Llama 2 model in C. You need a model checkpoint. Download this 15M parameter model I trained on the [TinyStories](https://huggingface.co/datasets/roneneldan/TinyStories) dataset (~60MB download):

```bash
wget https://huggingface.co/karpathy/tinyllamas/resolve/main/stories15M.bin
```

Compile and run the C code:

```bash
make run
./run stories15M.bin
```

You'll see the text stream a sample. On my M1 MacBook Air this runs at ~110 tokens/s. See [performance](#performance) or the Makefile for compile flags that can significantly speed this up. We can also try a bit bigger 42M parameter model:

```bash
wget https://huggingface.co/karpathy/tinyllamas/resolve/main/stories42M.bin
./run stories42M.bin
```

This still runs at interactive rates and samples more coherent and diverse stories:

> Once upon a time, there was a little girl named Lily. She loved playing with her toys on top of her bed. One day, she decided to have a tea party with her stuffed animals. She poured some tea into a tiny teapot and put it on top of the teapot. Suddenly, her little brother Max came into the room and wanted to join the tea party too. Lily didn't want to share her tea and she told Max to go away. Max started to cry and Lily felt bad. She decided to yield her tea party to Max and they both shared the teapot. But then, something unexpected happened. The teapot started to shake and wiggle. Lily and Max were scared and didn't know what to do. Suddenly, the teapot started to fly towards the ceiling and landed on the top of the bed. Lily and Max were amazed and they hugged each other. They realized that sharing was much more fun than being selfish. From that day on, they always shared their tea parties and toys.

You can also prompt the model with a prefix or a number of additional command line arguments, e.g. to sample at temperature 0.8 for 256 steps and with a prompt:

```bash
./run stories42M.bin -t 0.8 -n 256 -i "One day, Lily met a Shoggoth"
```

> One day, Lily met a Shoggoth. He was very shy, but was also very generous. Lily said “Hello Shoggy! Can I be your friend?” Shoggy was happy to have a friend and said “Yes, let’s explore the universe together!” So they set off on a journey to explore the universe. As they travelled, Shoggy was happy to explain to Lily about all the wonderful things in the universe. At the end of the day, Lily and Shoggy had gathered lots of wonderful things from the universe, and they both felt very proud. They promised to explore the universe as one big pair and to never stop being generous to each other.

There is also an even better 110M param model available, see [models](#models).

Quick note on sampling, the recommendation for ~best results is to sample with `-t 1.0 -p 0.9`, i.e. temperature 1.0 (default) but also top-p sampling at 0.9 (default). Intuitively, top-p ensures that tokens with tiny probabilities do not get sampled, so we can't get "unlucky" during sampling, and we are less likely to go "off the rails" afterwards. More generally, to control the diversity of samples use either the temperature (i.e. vary `-t` between 0 and 1 and keep top-p off with `-p 0`) or the top-p value (i.e. vary `-p` between 0 and 1 and keep `-t 1`), but not both. Nice explainers on LLM sampling strategies include [this](https://peterchng.com/blog/2023/05/02/token-selection-strategies-top-k-top-p-and-temperature/), [this](https://docs.cohere.com/docs/controlling-generation-with-top-k-top-p) or [this](https://huggingface.co/blog/how-to-generate).

## Meta's Llama 2 models

As the neural net architecture is identical, we can also inference the Llama 2 models released by Meta. Sadly there is a bit of friction here due to licensing (I can't directly upload the checkpoints, I think). So Step 1, get the Llama 2 checkpoints by following the [Meta instructions](https://github.com/facebookresearch/llama). Once we have those checkpoints, we have to convert them into the llama2.c format.
For this we need to install the python dependencies (`pip install -r requirements.txt`) and then use the `export.py` file, e.g. for 7B model:

```bash
python export.py llama2_7b.bin --meta-llama path/to/llama/model/7B
```

The export will take ~10 minutes or so and generate a 26GB file (the weights of the 7B model in float32) called `llama2_7b.bin` in the current directory. It has been [reported](https://github.com/karpathy/llama2.c/pull/85) that despite efforts. I would not attempt to run anything above 7B right now for two reasons: first, 13B+ currently doesn't work because of integer flow in pointer arithmetic, which is yet to be fixed, and second, even if it were fixed, this repo is doing float32 inference right now, so it would be fairly unusably slow. Once the export is done, we can run it:

```bash
./run llama2_7b.bin
```

This ran at about 4 tokens/s compiled with [OpenMP](#OpenMP) on 96 threads on my CPU Linux box in the cloud. (On my MacBook Air M1, currently it's closer to 30 seconds per token if you just build with `make runfast`.) Example output:

> The purpose of this document is to highlight the state-of-the-art of CoO generation technologies, both recent developments and those in commercial use. The focus is on the technologies with the highest merit to become the dominating processes of the future and therefore to be technologies of interest to S&amp;T ... R&amp;D. As such, CoO generation technologies developed in Russia, Japan and Europe are described in some depth. The document starts with an introduction to cobalt oxides as complex products and a short view on cobalt as an essential material. The document continues with the discussion of the available CoO generation processes with respect to energy and capital consumption as well as to environmental damage.

base models... ¯\\_(ツ)_/¯. Since we can inference the base model, it should be possible to also inference the chat model quite easily, and have a conversation with it. And if we can find a way to run 7B more efficiently, we can start adding LoRA to our training script, and going wild with finetunes all within the repo!

You can also chat with the Llama Chat models. Export the chat model exactly as above:

```bash
python export.py llama2_7b_chat.bin --meta-llama /path/to/7B-chat
```

Then chat with it by specifying the chat mode using the `-m` flag, e.g.:

```bash
./run llama2_7b_chat.bin -m chat
```

You can also try Meta's Code Llama models even if support for them is incomplete. In particular, some hyperparameters changed (e.g. the constant in RoPE layer), so the inference is not exactly correct and a bit buggy right now. Looking into fixes. Make sure to build the tokenizer for the plain and instruct variants and pass it when doing inference.

```bash
python export.py codellama2_7b.bin --meta-llama /path/to/CodeLlama-7b
python tokenizer.py --tokenizer-model=/path/to/CodeLlama-7b/tokenizer.model
./run codellama2_7b.bin -z /path/to/CodeLlama-7b/tokenizer.bin
```

Chat with Code Llama Instruct:

```bash
python export.py codellama2_7b_instruct.bin --meta-llama /path/to/CodeLlama-7b-Instruct
python tokenizer.py --tokenizer-model=/path/to/CodeLlama-7b-Instruct/tokenizer.model
./run codellama2_7b_instruct.bin -m chat -z /path/to/CodeLlama-7b-Instruct/tokenizer.bin
```

## int8 quantization

The (default) script [run.c](run.c), above, uses a float32 forward pass, where the entire calculation of the forward pass is kept in fp32. This is very easy to understand as far as reference code goes, but it has the following downsides: the model checkpoint files are very large (it takes 4 bytes per every individual weight), and the forward pass is relatively slow. The (very) common inference optimization employed in practice is to quantize the model parameters to lower precision, giving up a little bit of correctness in return for smaller checkpoint sizes and faster forward passes (as most of the inference uses integer arithmetic). Empirically, LLMs can tolerate precisions as low as 4-bit (or even lower), but we use int8 here because it is a "safe" setting that gets us the benefits but doesn't sacrifice too much of the model accuracy. Only the weights that participate in matmuls are quantized. All the other parameters (e.g. especially the scale and bias in RMSNorm) are kept in float32, because these layers are very sensitive. Now, if all you're after is reduction in checkpoint sizes, you could quantize the weights, save the checkpoint, and then dequantize them in run.c, and do float32 inference as normal and call it a day. This is totally fine. But here, we go one step further (as is standard practice) and additionally quantize the activations in the forward pass. This requires us to dynamically quantize and dequantize between float32 and int8 at runtime, which adds overhead. But the benefit is that now the majority of the calculations (the matmuls especially!) are using pure integer arithmetic, where both weights and activations enter as int8. This is where the speedups can fundamentally come from. The version we use is the "Q8_0" quantization (llama.cpp terminology), where the 0 means that the weight quantization is symmetric around 0, quantizing to the range [-127, 127].

The quantized forward pass is implemented in [runq.c](runq.c). To use it, we have to export the model in the quantized format. For example, the float32 version of Llama 2 7B was exported as:

```
python export.py llama2_7b.bin --meta-llama path/to/llama/model/7B
```

This creates a 26GB file, because each one of 7B parameters is 4 bytes (fp32). To export it quantized, we instead use version 2 export:

```
python export.py llama2_7b_q80.bin --version 2 --meta-llama path/to/llama/model/7B
```

This runs for a few minutes, but now creates only a 6.7GB file. For exporting non-meta checkpoints you would use the --checkpoint arg instead of --meta-llama arg (more docs on this later, below). Now let's inference them. I like to use OMP here because these are big models, so e.g. on my Linux box:

```
make runomp
OMP_NUM_THREADS=64 ./run llama2_7b.bin -n 40
OMP_NUM_THREADS=64 ./runq llama2_7b_q80.bin -n 40
```

This runs 40 steps just to get a timing. The float32 version for me runs at 4.6 tok/s, and the int8 version at 14 tok/s. So we achieved a 3X speedup while reducing the checkpoint size by 4X. However, the forward pass is quantized to int8, and therefore silently very slightly lower quality.

## huggingface models

We can load any huggingface models that use the Llama 2 architecture. See the script [export.py](export.py) and the `--hf` flag to export the model .bin file.

## models

For the sake of examples of smaller, from-scratch models, I trained a small model series on TinyStories. All of these trained in a few hours on my training setup (4X A100 40GB GPUs). The 110M took around 24 hours. I am hosting them on huggingface hub [tinyllamas](https://huggingface.co/karpathy/tinyllamas), both in the original PyTorch .pt, and also in the llama2.c format .bin:

| model | dim | n_layers | n_heads | n_kv_heads | max context length | parameters | val loss | download
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 260K | 64 | 5 | 8 | 4 | 512 | 260K | 1.297 | [stories260K](https://huggingface.co/karpathy/tinyllamas/tree/main/stories260K)
| OG | 288 | 6 | 6 | 6 | 256 | 15M | 1.072 | [stories15M.bin](https://huggingface.co/karpathy/tinyllamas/resolve/main/stories15M.bin) |
| 42M| 512 | 8 | 8 | 8 | 1024 | 42M | 0.847 | [stories42M.bin](https://huggingface.co/karpathy/tinyllamas/resolve/main/stories42M.bin) |
| 110M| 768 | 12 | 12 | 12 | 1024 | 110M | 0.760 | [stories110M.bin](https://huggingface.co/karpathy/tinyllamas/resolve/main/stories110M.bin) |

You'll notice that the 110M model is equivalent to GPT-1 in size. Alternatively, this is also the smallest model in the GPT-2 series (`GPT-2 small`), except the max context length is only 1024 instead of 2048. The only notable changes from GPT-1/2 architecture is that Llama uses RoPE relatively positional embeddings instead of absolute/learned positional embeddings, a bit more fancy SwiGLU non-linearity in the MLP, RMSNorm instead of LayerNorm, bias=False on all Linear layers, and is optionally multiquery.

## training

Let's see how we can train a baby Llama 2 from scratch using the code in this repo. First let's download and pretokenize some source dataset, e.g. I like [TinyStories](https://huggingface.co/datasets/roneneldan/TinyStories) so this is the only example currently available in this repo. But it should be very easy to add datasets, see the code.

```bash
python tinystories.py download
python tinystories.py pretokenize
```

Then train our model:

```bash
python train.py
```

**brief training guide**. See the train.py script for more exotic launches and hyperparameter overrides. Here is a brief guide to how to set the parameters. Look at the table at the very end of the [Chinchilla paper](https://arxiv.org/abs/2203.15556) to get a sense of how the Transformer parameters (dim, n_layers, n_heads) grow or shrink together. Extrapolate/interpolate this pattern to get bigger or smaller transformers. Set the max context length however you wish, depending on the problem: this should be the max number of tokens that matter to predict the next token. E.g. Llama 2 uses 2048. Next, you want the _total_ batch size per update (printed by the script as "tokens per iteration will be:") to be somewhere around 100K tokens for medium-sized applications. For tiny applications it could be lower, for large training (e.g. GPTs/LLamas) it is usually ~0.5M, or even more. You get there by first maxing out the batch_size to whatever your system allows (e.g. mine was 16 in a recent run because after that my GPU runs out of memory), and then you want to increase gradient_accumulation_steps to be as high as necessary to reach the total batch size of ~100K. Finally, you want to tune your learning_rate (LR). You want this to be as high as your training allows. Very small networks can get away with a large LR (e.g. 1e-3 or even higher). Large networks need lower LRs. 3e-4 is a safe choice in most medium-sized applications, but can be too low for small networks, so try to increase it! Finally, max_iters is the length of training. Play with different settings. I mostly only ever tune these parameters and leave most of the others unchanged. Here is an example of how I trained the 110M model, which I don't think is anywhere near optimal, but looked sensible to me: dim 768, n_layers 12, n_heads 12 (so size of each head is 768 / 12 = 64 channels), seq len of 1024, batch size 16 (this is the most that fit my A100 40GB GPU), gradient_accumulation_steps = 8 was needed to get total tokens batch size to be 16 batch size * 1024 tokens in sequence * 8 grad_accum = 131,072 tokens per update. Good. Learning rate 4e-4 (probably a little too low). max_iters 200K (probably a bit too high). Dropout 0.1, as that usually helps a bit at medium size. That was it. I ran using Distributed Data Parallel (DDP) on 4 GPUs on my cloud machine, training took ~day or so.

Totally understand if you want to skip model training, for simple demo just download one of the pretrained models (see [models](#models) section), e.g.:

```bash
wget https://huggingface.co/karpathy/tinyllamas/resolve/main/stories15M.bin
```

Once we have the model.bin file, we can inference in C. Compile the C code first:

```bash
make run
```

You can now run it simply as

```bash
./run stories15M.bin
```

Watch the tokens stream by, fun! We can also run the PyTorch inference script for a comparison. Download one of the models again from huggingface hub and point the `sample.py` script at it:

```bash
wget https://huggingface.co/karpathy/tinyllamas/resolve/main/stories15M.pt -P out15M
python sample.py --checkpoint=out15M/stories15M.pt
```

Which gives the same results.

## custom tokenizers

In everything above, we've assumed the custom Lllama 2 tokenizer with 32,000 tokens. However, in many boutique LLMs, using vocabulary this big might be an overkill. If you have a small application you have in mind, you might be much better off training your own tokenizers. This can make everything nicer - with smaller vocabs your model has fewer parameters (because the token embedding table is a lot smaller), the inference is faster (because there are fewer tokens to predict), and your average sequence length per example could also get smaller (because the compression is a lot more efficient on your data). So let's see how we train a custom tokenizer.

By default, to pretokenize the tinystories dataset we had to run, in order:

```
python tinystories.py download
python tinystories.py pretokenize
```

The `pretokenize` stage here loads the Llama 2 tokenizer (vocab size 32,000) and uses it to convert the downloaded text into integers, and saves that to file. We now change this as follows, to train an example 4096-token tokenizer:

```
python tinystories.py download
python tinystories.py train_vocab --vocab_size=4096
python tinystories.py pretokenize --vocab_size=4096
```

The `train_vocab` stage will call the `sentencepiece` library to train the tokenizer, storing it in a new file `data/tok4096.model`. I tried to reproduce as well as I could the settings that (I think) Meta used to train their vocabulary. This uses the Byte Pair Encoding algorithm that starts out with raw utf8 byte sequences of the text data and then iteratively merges the most common consecutive pairs of tokens to form the vocabulary. Inspect the `tinystories.py` file - the custom tokenizers are stored in a special directory structure indexed by the vocab size.

A quick note of interest is that vocab size of 4096 trained specifically on tinystories creates integer sequences with about the same sequence length per example as the default Llama 2 tokenizer of 32000 tokens! This means that our custom, tailored tokenizer is a lot better adapted to our specific text, and can compress it very effectively. So our trained models are smaller and faster.

Now that we have pretokenized the dataset with our custom tokenizer, we can train the model. The training script `train.py` doesn't care about the exact tokens, it only cares about the vocabulary size so it can correctly initialize the model. So when training your model, make sure to pass in

```
python train.py --vocab_source=custom --vocab_size=4096
```

(The defaults are `llama2` and `32000` respectively, which indicates the default Llama 2 tokenizer). This trains the model. Finally we are ready to run inference with our `run.c` script. For that we need two things. Number one, we have to export our tokenizer in the `.bin` format, do that with:

```
python tokenizer.py --tokenizer-model=data/tok4096.model
```

This writes the tokenizer to `data/tok4096.bin`. Now we can run inference, pointing it to this tokenizer using the `-z` flag:

```
./run out/model.bin -z data/tok4096.bin
```

This should print the samples. If you leave out the `-z` flag, it will use the default Llama 2 tokenizer, which would generate a good sequence of integers, but they would get translated using a different vocabulary to text, so it would look like gibberish.

## performance

There are many ways to potentially speed up this code depending on your system. Have a look at the [Makefile](Makefile), which contains a lot of notes. The `make run` command currently uses the `-O3` optimization by default, i.e.:

```bash
gcc -O3 -o run run.c -lm
```

-O3 includes optimizations that are expensive in terms of compile time and memory usage. Including vectorization, loop unrolling, and predicting branches.

To get a much better performance, try to compile with `make runfast`. This turns on the `-Ofast` flag, which includes additional optimizations that may break compliance with the C/IEEE specifications, in addition to `-O3`. See [the GCC docs](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html) for more information.

Try `-march=native` to compile the program to use the architecture of the machine you're compiling on rather than a more generic CPU. This may enable additional optimizations and hardware-specific tuning such as improved vector instructions/width.

The fastest throughput I saw so far on my MacBook Air (M1) so far is with `make runfast`.

You can also experiment with replacing `gcc` with `clang`.

If compiling with gcc, try experimenting with `-funroll-all-loops`, see PR [#183](https://github.com/karpathy/llama2.c/pull/183)

**OpenMP**. Big improvements can also be achieved by compiling with OpenMP, which "activates" the `#pragma omp parallel for` inside the matmul and attention, allowing the work in the loops to be split up over multiple processors.
You'll need to install the OpenMP library and the clang compiler first (e.g. `apt install clang libomp-dev` on ubuntu). Then you can compile with `make runomp`, which does:

```bash
clang -Ofast -fopenmp -march=native run.c  -lm  -o run
```

When you run inference make sure to use OpenMP flags to set the number of threads, e.g.:

```bash
OMP_NUM_THREADS=4 ./run out/model.bin
```

Depending on your system resources you may want to tweak these hyperparameters and use more threads. But more is not always better, usually this is a bit U shaped. In particular, if your CPU has SMT (multithreading), try setting the number of threads to the number of physical cores rather than logical cores. The performance difference can be large due to cache thrashing and communication overhead. The PyTorch documentation [CPU specific optimizations
](https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html#cpu-specific-optimizations) has some good information that applies here too.

## platforms

On **Windows**, use `build_msvc.bat` in a Visual Studio Command Prompt to build with msvc, or you can use `make win64` to use mingw compiler toolchain from linux or windows to build the windows target. MSVC build will automatically use openmp and max threads appropriate for your CPU unless you set `OMP_NUM_THREADS` env.

On **Centos 7**, **Amazon Linux 2018** use `rungnu` Makefile target: `make rungnu` or `make runompgnu` to use openmp.

On **Mac**, use clang from brew for openmp build. Install clang as `brew install llvm` and use the installed clang binary to compile with openmp: `make runomp CC=/opt/homebrew/opt/llvm/bin/clang`

## tests

You can run tests simply with pytest:

```bash
$ pip install pytest
$ pytest
```

This will currently invoke two tests inside `test_all.py`, which forward the model in both C and Python for 200 steps and check the output against a known good expected output. The tests currently run in only a few seconds, but will have to download and cache the stories260K models in a temporary `test` directory (only ~2MB download).

There are also some tests in C, in the file [test.c](test.c). You can run these with `make testcc`, or to see more stuff printed:

```
make testcc VERBOSITY=1
```

Call for help: help add more tests.

## ack

I trained the llama2.c storyteller models on a 4X A100 40GB box graciously provided by the excellent [Lambda labs](https://lambdalabs.com/service/gpu-cloud), thank you.

## discord

Figured it's possible to reuse my existing discord channel (that I use for my [zero to hero youtube series](https://karpathy.ai/zero-to-hero.html)), see #llama2c channel on [discord](https://discord.gg/3zy8kqD9Cp), for any quick questions, related discussions, etc.

## contributing

A few words on this repo and the kinds of PRs that are likely to be accepted. What is the goal of this repo? Basically I think there will be a lot of interest in training or finetuning custom micro-LLMs (think ~100M - ~1B params, but let's say up to ~10B params) across a large diversity of applications, and deploying them in edge-adjacent environments (think MCUs, phones, web browsers, laptops, etc.). I'd like this repo to be the simplest, smallest, most hackable repo to support this workflow, both training and inference. In particular, this repo is not a complex framework with a 1000 knobs controlling inscrutible code across a nested directory structure of hundreds of files. Instead, I expect most applications will wish to create a fork of this repo and hack it to their specific needs and deployment platforms.

People who care about deployment efficiency above all else should look at [llama.cpp](https://github.com/ggerganov/llama.cpp). This repo still cares about efficiency, but not at the cost of simplicity, readability or portability. Basically, I expect that a lot of people come to this repo because the training code is 2 readable .py files and the inference code is 500 lines of C. So I'd like this to continue to be a kind of simplest "reference implementation" that can be easily hacked in a separate fork into whatever downstream application people are excited about. It shouldn't be full-featured. It shouldn't take 100 different options or settings. It shouldn't be the most efficient. A few examples:

- someone re-ordered two loops to improve data locality for a small efficieny win => instant merge.
- someone added the one line "pragma omp parallel for", which allows you to compile with OpenMP and dramatically speed up the code, or acts as just a comment if you don't compile it that way => instant merge.
- bug fixes and touchups etc. => happy to merge

A few examples of PRs are that are not an excellent fit:

- adding more than several #ifdefs all over the place in code. If they are localized / few, might be okay.
- adding a lot of code that is very specific to some specific platform (e.g. MCUs, or some special version of linux or processor). These may be a better fit for forks of the project, and I am very happy to maintain a list of these forks in section below.
- adding hundreds of lines of code to run.c that are only active in specific scenarios or platforms.

If your candidate PRs have elements of these it doesn't mean they won't get merged, it just means they will make it into the gray territory. TLDR: I am eager to merge any mostly small, mostly localized, broadly applicable, clean changes that improve the efficiency and portability of the repo, while keep its hackability and readability. I appreciate all PRs seeking to help me improve the project, thank you! <3.

## notable forks

- Rust
  - [llama2.rs](https://github.com/gaxler/llama2.rs) by @[gaxler](https://github.com/gaxler): a Rust port of this project
  - [llama2.rs](https://github.com/leo-du/llama2.rs) by @[leo-du](https://github.com/leo-du): A Rust port of this project
  - [llama2-rs](https://github.com/danielgrittner/llama2-rs) by @[danielgrittner](https://github.com/danielgrittner): a Rust port of this project
  - [llama2.rs](https://github.com/lintian06/llama2.rs) by @[lintian06](https://github.com/lintian06): A Rust port of this project
  - [pecca.rs](https://github.com/rahoua/pecca-rs) by @[rahoua](https://github.com/rahoua): A Rust port leveraging [ndarray](https://github.com/rust-ndarray/ndarray), supports BLAS.
  - [llama2.rs](https://github.com/flaneur2020/llama2.rs) by @[flaneur2020](https://github.com/flaneur2020): A Rust port of this project.
  - [llama2-burn](https://github.com/code-cp/llama2-burn): A Rust port of this project leveraging [Burn](https://github.com/tracel-ai/burn)
- Go
  - [go-llama2](https://github.com/tmc/go-llama2) by @[tmc](https://github.com/tmc): a Go port of this project
  - [llama2.go](https://github.com/nikolaydubina/llama2.go) by @[nikolaydubina](https://github.com/nikolaydubina): a Go port of this project
  - [llama2.go](https://github.com/haormj/llama2.go) by @[haormj](https://github.com/haormj): a Go port of this project
  - [llama2.go](https://github.com/saracen/llama2.go) by @[saracen](https://github.com/saracen): a Go port of this project
- Android
  - [llama2.c-android](https://github.com/Manuel030/llama2.c-android): by @[Manuel030](https://github.com/Manuel030): adds Android binaries of this project
  - [llama2.c-android-wrapper](https://github.com/celikin/llama2.c-android-wrapper): by @[celikin](https://github.com/celikin): added JNI wrapper, PoC
- C
  - [llama3.c](https://github.com/jameswdelancey/llama3.c): by @[jameswdelancey](https://github.com/jameswdelancey): a LLaMA 3 8B Base and Instruct port of this project
- C++
  - [llama2.cpp](https://github.com/leloykun/llama2.cpp) by @[leloykun](https://github.com/leloykun): a C++ port of this project
  - [llama2.cpp](https://github.com/coldlarry/llama2.cpp) by @[coldlarry](https://github.com/coldlarry): a C++ port of this project
- JavaScript
  - [llama2.js](https://github.com/epicure/llama2.js) by @[epicure](https://github.com/epicure): a JavaScript port of this project
  - [llamajs](https://github.com/agershun/llamajs) by @[agershun](https://github.com/agershun): a JavaScript port of this project
  - [llama2.ts](https://github.com/wizzard0/llama2.ts) by @[oleksandr_now](https://twitter.com/oleksandr_now): a TypeScript port of this project. Full Llama2-7B capable.
  - [llama2.c-emscripten](https://github.com/gohai/llama2.c-emscripten) by @[gohai](https://github.com/gohai): Emscripten (JavaScript) port, based on @ggerganov's initial prototype
- Zig
  - [llama2.zig](https://github.com/cgbur/llama2.zig) by @[cgbur](https://github.com/cgbur): A Zig port of this project
  - [llama2.zig](https://github.com/vodkaslime/llama2.zig) by @[vodkaslime](https://github.com/vodkaslime): a Zig port of this project
  - [llama2.zig](https://github.com/clebert/llama2.zig) by @[clebert](https://github.com/clebert): a Zig port of this project
- Julia
  - [llama2.jl](https://github.com/juvi21/llama2.jl) by @[juvi21](https://github.com/juvi21): a Julia port of this project
- Scala
  - [llama2.scala](https://github.com/jrudolph/llama2.scala) by @[jrudolph](https://github.com/jrudolph): a Scala port of this project
- Java
  - [llama2.java](https://github.com/mukel/llama2.java) by @[mukel](https://github.com/mukel): a Java port of this project
  - [llama2.java](https://github.com/neoremind/llama2.java) by @[neoremind](https://github.com/neoremind): a Java port of this project
  - [llama2.tornadovm.java](https://github.com/mikepapadim/llama2.tornadovm.java) by @[mikepapadim](https://github.com/mikepapadim): an extension of the llama2.java with GPU-support through [TornadoVM](https://github.com/beehive-lab/TornadoVM).
- Kotlin
  - [llama2.kt](https://github.com/madroidmaq/llama2.kt) by @[madroidmaq](https://github.com/madroidmaq): a Kotlin port of this project
  - [llama2-kmp](https://github.com/stepango/llama2-kmp) by @[stepango](https://github.com/stepango): a Kotlin multiplatform(KMP) port of this project 
- Python
  - [llama2.py](https://github.com/tairov/llama2.py) by @[tairov](https://github.com/tairov): a simple one file pure Python port of this project with zero dependencies
- C#
  - [llama2.cs](https://github.com/trrahul/llama2.cs) by @[trrahul](https://github.com/trrahul): a C# port of this project
- F#
  - [llama2.fs](https://github.com/micsh/llama2.fs) by @[micsh](https://github.com/micsh): a F# port of this project
- Dart
  - [llama2.dart](https://github.com/yiminghan/llama2.dart) by @[yiminghan](https://github.com/yiminghan/llama2.dart): one-file dart port of this project, works with Flutter!
- Web
  - [llama2c-web](https://github.com/dmarcos/llama2.c-web) by @[dmarcos](https://github.com/dmarcos): Super simple way to build unmodified llama2.c to WASM and run it in the browser. [Demo](https://diegomarcos.com/llama2.c-web/)
  - [llama2.rs.wasm](https://github.com/mtb0x1/llama2.rs.wasm) by @[mtb0x1](https://github.com/mtb0x1/) : a [Demo](https://mtb0x1.github.io/llama2.rs.wasm/) of all listed rust ports to WASM, all in one web page.
- WebAssembly
  - [icpp-llm](https://github.com/icppWorld/icpp-llm): LLMs for the Internet Computer
- Fortran
  - [llama2.f90](https://github.com/rbitr/llama2.f90): a Fortran port of this project
- Mojo
  - [llama2.🔥](https://github.com/tairov/llama2.mojo) by @[tairov](https://github.com/tairov): pure Mojo port of this project
- OCaml
  - [llama2.ml](https://github.com/jackpeck/llama2.ml) by @[jackpeck](https://github.com/jackpeck): an OCaml port of this project
- Hare
  - [llama2.ha](https://sr.ht/~dvshkn/llama2.ha) by @[dvshkn](https://git.sr.ht/~dvshkn): a Hare port of this project
- [llama2.c - Llama 2 Everywhere](https://github.com/trholding/llama2.c) by @[trholding](https://github.com/trholding): Standalone, Bootable & Portable Binary Llama 2
- [llama2.c-zh - Bilingual Chinese and English](https://github.com/chenyangMl/llama2.c-zh) by @[chenyangMl](https://github.com/chenyangMl): Expand tokenizer to support training and inference in both Chinese and English
- Haskell
  - [llama2.hs](https://github.com/chris-ch/llama2.hs) by @[chris-ch](https://github.com/chris-ch): an Haskell port of this project

## unsorted todos

- add support in run.c of reading version 1+ files from export, later deprecate "version 0"
- run.cu (CUDA) investigate and merge
- add more tests inside [test.c](test.c)
- add Engine class for use in sample.py that does efficient inference in PyTorch, e.g. KV cache keeping
- make it easier to add a new dataset with not too much pain
- (LoRA) finetuning and export of Llama 2 models

## License

MIT
```

### `doc/stories260K.md`

```markdown
# stories260K

[Stories260K huggginface link](https://huggingface.co/karpathy/tinyllamas)

The 260K model is a tiny model used for testing, and was trained as follows:

```
python train.py \
    --out_dir="outmini" \
    --batch_size=128 \
    --max_seq_len=512 \
    --gradient_accumulation_steps=1 \
    --vocab_source="custom" \
    --vocab_size=512 \
    --dim=64 \
    --n_layers=5 \
    --n_heads=8 \
    --n_kv_heads=4 \
    --multiple_of=4 \
    --learning_rate=1e-3 \
    --dropout=0.05 \
    --weight_decay=0.01 \
    --max_iters=100000 \
    --beta2=0.99 \
    --warmup_iters=1000 \
    --eval_interval=2000 \
    --eval_iters=100 \
    --compile=True
```

You'll notice that `n_kv_heads` is 4 while `n_heads` is 8, so two heads at a time share their key,value projections, i.e. this model is 2X multiquery. You'll also notice that we're using a custom tokenizer with 512 tokens. The model trained for ~10 minutes (?) on my A100 and achieves validation loss of 1.2968.

Sampling this model at temperature 0.0 (i.e. deterministic greedy argmax sampling) gives:

```
$ ./run stories260K/stories260K.bin -z stories260K/tok512.bin -t 0.0
Once upon a time, there was a little girl named Lily. She loved to play outside in the park. One day, she saw a big, red ball. She wanted to play with it, but it was too high.
Lily's mom said, "Lily, let's go to the park." Lily was sad and didn't know what to do. She said, "I want to play with your ball, but I can't find it."
Lily was sad and didn't know what to do. She said, "I'm sorry, Lily. I didn't know what to do."
Lily didn't want to help her mom, so she said, "I'm sorry, mom. I didn't know what to do." Her mom said, "Don't worry, Lily. We can help you.
```

You can reproduce the same in Python by running `sample.py`:

```
$ python sample.py --checkpoint=stories260K/stories260K.pt --tokenizer=stories260K/tok512.model --temperature=0.0 --max_new_tokens=257
```

I hardcoded max tokens to be 257 manually because the `sample.py` script doesn't currently terminate on the special BOS token like the run.c script does. Sampling at 1.0 with topp of 0.9 gives a bit more reasonable samples:

```
$ ./run stories260K/stories260K.bin -z stories260K/tok512.bin -t 1.0 -p 0.9 -s 133742
Once upon a time, there was a little boy named Timmy. Timmy loved to play with his toys and eat sandwiches. One day, Timmy's mom told him it was time to rest for a while. Timmy's friend Billy came over and took him a down.
Timmy's mom saw that Timmy was sad, but Timmy said, "I didn't understand what is it! We need to find some leafs." Timmy thought about it and took a deep breath on a spoon. He hoped it was important to be kind and continued to find its image next time.
After they finished getting, Timmy's dad came up to his house and promised to help Timmy.
```

Hey you can't expect too much from a 260K parameter model. I'm even mildly shocked we get this far :D
```

### `doc/train_llama_tokenizer.md`

```markdown
# training llama tokenizer

How does Meta train their sentencepiece tokenizer? You can print the config as follows:

```python
import sentencepiece.sentencepiece_model_pb2
mp = sentencepiece.sentencepiece_model_pb2.ModelProto()
mp.ParseFromString(open("tokenizer.model", "rb").read())
print(mp.trainer_spec)
print(mp.normalizer_spec)
```

this gives:

```
trainer_spec {
  input: "/large_experiments/theorem/datasets/MERGED/all.test1.merged"
  model_prefix: "spm_model_32k_200M_charcov099995_allowWSO__v2"
  model_type: BPE
  vocab_size: 32000
  self_test_sample_size: 0
  input_format: "text"
  character_coverage: 0.9999499917030334
  input_sentence_size: 200000000
  seed_sentencepiece_size: 1000000
  shrinking_factor: 0.75
  num_threads: 80
  num_sub_iterations: 2
  max_sentence_length: 4192
  shuffle_input_sentence: true
  max_sentencepiece_length: 16
  split_by_unicode_script: true
  split_by_whitespace: true
  split_by_number: true
  treat_whitespace_as_suffix: false
  split_digits: true
  allow_whitespace_only_pieces: true
  vocabulary_output_piece_score: true
  hard_vocab_limit: true
  use_all_vocab: false
  byte_fallback: true
  required_chars: ""
  unk_id: 0
  bos_id: 1
  eos_id: 2
  pad_id: -1
  unk_surface: " \342\201\207 "
  unk_piece: "<unk>"
  bos_piece: "<s>"
  eos_piece: "</s>"
  pad_piece: "<pad>"
  train_extremely_large_corpus: false
  enable_differential_privacy: false
  differential_privacy_noise_level: 0.0
  differential_privacy_clipping_threshold: 0
}
normalizer_spec {
  name: "identity"
  precompiled_charsmap: ""
  add_dummy_prefix: true
  remove_extra_whitespaces: false
  normalization_rule_tsv: ""
}
```

We can use the sentencepiece spm_train to train the same models, but optionally smaller. Here are their [options docs](https://github.com/google/sentencepiece/blob/master/doc/options.md) we can refer to. It's not much but it helps.

We'll depart on one setting, I recommend changing `character_coverage` -> 1.0. We also want to make sure to note the following important settings that come up in the paper and are not necessarily the default sentencepiece settings:

```
--split-digits = true
--allow_whitespace_only_pieces = true
--byte_fallback = true
--normalization_rule_name = identity
```

With this in mind we can train a sentencepiece vocab in what I believe is probably the same to how Meta trained theirs as:

```
spm_train --input="$input" \
          --model_prefix="$model_prefix" \
          --model_type=bpe \
          --vocab_size="$vocab_size" \
          --self_test_sample_size=0 \
          --input_format="text" \
          --character_coverage=1.0 \
          --num_threads="$(nproc)" \
          --split_digits=true \
          --allow_whitespace_only_pieces=true \
          --byte_fallback=true \
          --unk_surface=" \342\201\207 " \
          --normalization_rule_name=identity \
```

Where $input is the input file, $model_prefix is the output path prefix, vocab_size is the desired vocab, and we're by default taking over the CPU resources of the machine.

Lastly note that sentencepiece is weird and expects "sentences" delimited by newlines as the input. You can't just put in a massive block of text. And they have a hyperparameter that constols the maximum size of a "sentence". Fwiw I really dislike this design choice around a weird concept of a "sentence". It should just be block of text with no assumptions. But here we are.

Look into the file `tinystories.py` where we train the vocab in the same way, but using Python bindings instead.
```

### Important image/diagram links

- `README.md` → https://colab.research.google.com/assets/colab-badge.svg
- `README.md` → https://raw.githubusercontent.com/karpathy/llama2.c/master/assets/llama_cute.jpg

## karpathy/nanochat (branch: `master`)

### `README.md`

```markdown
# nanochat

![nanochat logo](dev/nanochat.png)
![scaling laws](dev/scaling_laws_jan26.png)

nanochat is the simplest experimental harness for training LLMs. It is designed to run on a single GPU node, the code is minimal/hackable, and it covers all major LLM stages including tokenization, pretraining, finetuning, evaluation, inference, and a chat UI. For example, you can train your own GPT-2 capability LLM (which cost ~$43,000 to train in 2019) for only $48 (~2 hours of 8XH100 GPU node) and then talk to it in a familiar ChatGPT-like web UI. On a spot instance, the total cost can be closer to ~$15. More generally, nanochat is configured out of the box to train an entire miniseries of compute-optimal models by setting one single complexity dial: `--depth`, the number of layers in the GPT transformer model (GPT-2 capability happens to be approximately depth 26). All other hyperparameters (the width of the transformer, number of heads, learning rate adjustments, training horizons, weight decays, ...) are calculated automatically in an optimal way.

For questions about the repo, I recommend either using [DeepWiki](https://deepwiki.com/karpathy/nanochat) from Devin/Cognition to ask questions about the repo, or use the [Discussions tab](https://github.com/karpathy/nanochat/discussions), or come by the [#nanochat](https://discord.com/channels/1020383067459821711/1427295580895314031) channel on Discord.

## Time-to-GPT-2 Leaderboard

Presently, the main focus of development is on tuning the pretraining stage, which takes the most amount of compute. Inspired by the modded-nanogpt repo and to incentivise progress and community collaboration, nanochat maintains a leaderboard for a "GPT-2 speedrun", which is the wall-clock time required to train a nanochat model to GPT-2 grade capability, as measured by the DCLM CORE score. The [runs/speedrun.sh](runs/speedrun.sh) script always reflects the reference way to train GPT-2 grade model and talk to it. The current leaderboard looks as follows:

| # | time | val_bpb | CORE | Description | Date | Commit | Contributors |
|---|-------------|---------|------|-------------|------|--------|--------------|
| 0 | 168 hours | - | 0.2565 | Original OpenAI GPT-2 checkpoint | 2019 | - | OpenAI |
| 1 | 3.04 | 0.74833 | 0.2585 | d24 baseline, slightly overtrained | Jan 29 2026 | 348fbb3 | @karpathy |
| 2 | 2.91 | 0.74504 | 0.2578 | d26 slightly undertrained **+fp8** | Feb 2 2026 | a67eba3 | @karpathy |
| 3 | 2.76 | 0.74645 | 0.2602 | bump total batch size to 1M tokens | Feb 5 2026 | 2c062aa | @karpathy |
| 4 | 2.02 | 0.71854 | 0.2571 | change dataset to NVIDIA ClimbMix | Mar 4 2026 | 324e69c | @ddudek @karpathy |
| 5 | 1.80 | 0.71808 | 0.2690 | autoresearch [round 1](https://x.com/karpathy/status/2031135152349524125) | Mar 9 2026 | 6ed7d1d | @karpathy |
| 6 | 1.65 | 0.71800 | 0.2626 | autoresearch round 2 | Mar 14 2026 | a825e63 | @karpathy |

The primary metric we care about is "time to GPT-2" - the wall clock time needed to outperform the GPT-2 (1.6B) CORE metric on an 8XH100 GPU node. The GPT-2 CORE score is 0.256525. In 2019, the training of GPT-2 cost approximately $43,000 so it is incredible that due to many advances over 7 years across the stack, we can now do so much faster and for well below $100 (e.g. at the current ~$3/GPU/hr, an 8XH100 node is ~$24/hr, so 2 hours is ~$48).

See [dev/LEADERBOARD.md](dev/LEADERBOARD.md) for more docs on how to interpret and contribute to the leaderboard.

## Getting started

### Setup

nanochat uses [uv](https://docs.astral.sh/uv/) for dependency management. To install:

```bash
uv sync --extra gpu    # Use for CUDA (A100/H100/etc.)
uv sync --extra cpu    # (or) Use for CPU-only / MPS
source .venv/bin/activate
```

For development (adds pytest, matplotlib, ipykernel, transformers, etc.):

```bash
uv sync --extra gpu --group dev
```

### Reproduce and talk to GPT-2

The most fun you can have is to train your own GPT-2 and talk to it. The entire pipeline to do so is contained in the single file [runs/speedrun.sh](runs/speedrun.sh), which is designed to be run on an 8XH100 GPU node. Boot up a new 8XH100 GPU box from your favorite provider (e.g. I use and like [Lambda](https://lambda.ai/service/gpu-cloud)), and kick off the training script:

```bash
bash runs/speedrun.sh
```

You may wish to do so in a screen session as this will take ~3 hours to run. Once it's done, you can talk to it via the ChatGPT-like web UI. Make sure again that your local uv virtual environment is active (run `source .venv/bin/activate`), and serve it:

```bash
python -m scripts.chat_web
```

And then visit the URL shown. Make sure to access it correctly, e.g. on Lambda use the public IP of the node you're on, followed by the port, so for example [http://209.20.xxx.xxx:8000/](http://209.20.xxx.xxx:8000/), etc. Then talk to your LLM as you'd normally talk to ChatGPT! Get it to write stories or poems. Ask it to tell you who you are to see a hallucination. Ask it why the sky is blue. Or why it's green. The speedrun is a 4e19 FLOPs capability model so it's a bit like talking to a kindergartener :).

---

<img width="2672" height="1520" alt="image" src="https://github.com/user-attachments/assets/ed39ddf8-2370-437a-bedc-0f39781e76b5" />

---

A few more notes:

- The code will run just fine on the Ampere 8XA100 GPU node as well, but a bit slower.
- All code will run just fine on even a single GPU by omitting `torchrun`, and will produce ~identical results (code will automatically switch to gradient accumulation), but you'll have to wait 8 times longer.
- If your GPU(s) have less than 80GB, you'll have to tune some of the hyperparameters or you will OOM / run out of VRAM. Look for `--device-batch-size` in the scripts and reduce it until things fit. E.g. from 32 (default) to 16, 8, 4, 2, or even 1. Less than that you'll have to know a bit more what you're doing and get more creative.
- Most of the code is fairly vanilla PyTorch so it should run on anything that supports that - xpu, mps, or etc, but I haven't personally exercised all of these code paths so there might be sharp edges.

## Research

If you are a researcher and wish to help improve nanochat, two scripts of interest are [runs/scaling_laws.sh](runs/scaling_laws.sh) and [runs/miniseries.sh](runs/miniseries.sh). See [Jan 7 miniseries v1](https://github.com/karpathy/nanochat/discussions/420) for related documentation. For quick experimentation (~5 min pretraining runs) my favorite scale is to train a 12-layer model (GPT-1 sized), e.g. like this:

```
OMP_NUM_THREADS=1 torchrun --standalone --nproc_per_node=8 -m scripts.base_train -- \
    --depth=12 \
    --run="d12" \
    --model-tag="d12" \
    --core-metric-every=999999 \
    --sample-every=-1 \
    --save-every=-1 \
```

This uses wandb (run name "d12"), only runs the CORE metric on last step, and it doesn't sample and save intermediate checkpoints. I like to change something in the code, re-run a d12 (or a d16 etc) and see if it helped, in an iteration loop. To see if a run helps, I like to monitor the wandb plots for:

1. `val_bpb` (validation loss in vocab-size-invariant units of bits per byte) as a function of `step`, `total_training_time` and `total_training_flops`.
2. `core_metric` (the DCLM CORE score)
3. VRAM utilization, `train/mfu` (Model FLOPS utilization), `train/tok_per_sec` (training throughput)

See an example [here](https://github.com/karpathy/nanochat/pull/498#issuecomment-3850720044).

The important thing to note is that nanochat is written and configured around one single dial of complexity - the depth of the transformer. This single integer automatically determines all other hyperparameters (the width of the transformer, number of heads, learning rate adjustments, training horizons, weight decays, ...) so that the trained model comes out compute optimal. The idea is that the user doesn't have to think about or set any of this, they are simply asking for a smaller or bigger model using `--depth`, and everything "just works". By sweeping out the depth, you achieve the nanochat miniseries of compute optimal models at various sizes. GPT-2 capability model (which is of most interest at the moment) happens to be somewhere around d24-d26 range with the current code. But any candidate changes to the repo have to be principled enough that they work for all settings of depth.

## Running on CPU / MPS

The script [runs/runcpu.sh](runs/runcpu.sh) shows a very simple example of running on CPU or Apple Silicon. It dramatically shrinks the LLM that is being trained to make things fit into a reasonable time interval of a few ten minutes of training. You will not get strong results in this way.

## Precision / dtype

nanochat does not use `torch.amp.autocast`. Instead, precision is managed explicitly through a single global `COMPUTE_DTYPE` (defined in `nanochat/common.py`). By default this is auto-detected based on your hardware:

| Hardware | Default dtype | Why |
|----------|--------------|-----|
| CUDA SM 80+ (A100, H100, ...) | `bfloat16` | Native bf16 tensor cores |
| CUDA SM < 80 (V100, T4, ...) | `float32` | No bf16; fp16 available via `NANOCHAT_DTYPE=float16` (uses GradScaler) |
| CPU / MPS | `float32` | No reduced-precision tensor cores |

You can override the default with the `NANOCHAT_DTYPE` environment variable:

```bash
NANOCHAT_DTYPE=float32 python -m scripts.chat_cli -p "hello"   # force fp32
NANOCHAT_DTYPE=bfloat16 torchrun --nproc_per_node=8 -m scripts.base_train  # force bf16
```

How it works: model weights are stored in fp32 (for optimizer precision), but our custom `Linear` layer casts them to `COMPUTE_DTYPE` during the forward pass. Embeddings are stored directly in `COMPUTE_DTYPE` to save memory. This gives us the same mixed-precision benefit as autocast but with full explicit control over what runs in which precision.

Note: `float16` training automatically enables a `GradScaler` in `base_train.py` to prevent gradient underflow. SFT supports this too but RL currently does not. Inference in fp16 works fine everywhere.

## Guides

I've published a number of guides that might contain helpful information, most recent to least recent:

- [Feb 1 2026: Beating GPT-2 for <<$100: the nanochat journey](https://github.com/karpathy/nanochat/discussions/481)
- [Jan 7 miniseries v1](https://github.com/karpathy/nanochat/discussions/420) documents the first nanochat miniseries of models.
- To add new abilities to nanochat, see [Guide: counting r in strawberry (and how to add abilities generally)](https://github.com/karpathy/nanochat/discussions/164).
- To customize your nanochat, see [Guide: infusing identity to your nanochat](https://github.com/karpathy/nanochat/discussions/139) in Discussions, which describes how you can tune your nanochat's personality through synthetic data generation and mixing that data into the SFT stage.
- [Oct 13 2025: original nanochat post](https://github.com/karpathy/nanochat/discussions/1) introducing nanochat, though now it contains some deprecated information and the model is a lot older (with worse results) than current master.

## File structure

```
.
├── LICENSE
├── README.md
├── dev
│   ├── gen_synthetic_data.py       # Example synthetic data for identity
│   ├── generate_logo.html
│   ├── nanochat.png
│   └── repackage_data_reference.py # Pretraining data shard generation
├── nanochat
│   ├── __init__.py                 # empty
│   ├── checkpoint_manager.py       # Save/Load model checkpoints
│   ├── common.py                   # Misc small utilities, quality of life
│   ├── core_eval.py                # Evaluates base model CORE score (DCLM paper)
│   ├── dataloader.py               # Tokenizing Distributed Data Loader
│   ├── dataset.py                  # Download/read utils for pretraining data
│   ├── engine.py                   # Efficient model inference with KV Cache
│   ├── execution.py                # Allows the LLM to execute Python code as tool
│   ├── gpt.py                      # The GPT nn.Module Transformer
│   ├── logo.svg
│   ├── loss_eval.py                # Evaluate bits per byte (instead of loss)
│   ├── optim.py                    # AdamW + Muon optimizer, 1GPU and distributed
│   ├── report.py                   # Utilities for writing the nanochat Report
│   ├── tokenizer.py                # BPE Tokenizer wrapper in style of GPT-4
│   └── ui.html                     # HTML/CSS/JS for nanochat frontend
├── pyproject.toml
├── runs
│   ├── miniseries.sh               # Miniseries training script
│   ├── runcpu.sh                   # Small example of how to run on CPU/MPS
│   ├── scaling_laws.sh             # Scaling laws experiments
│   └── speedrun.sh                 # Train the ~$100 nanochat d20
├── scripts
│   ├── base_eval.py                # Base model: CORE score, bits per byte, samples
│   ├── base_train.py               # Base model: train
│   ├── chat_cli.py                 # Chat model: talk to over CLI
│   ├── chat_eval.py                # Chat model: eval tasks
│   ├── chat_rl.py                  # Chat model: reinforcement learning
│   ├── chat_sft.py                 # Chat model: train SFT
│   ├── chat_web.py                 # Chat model: talk to over WebUI
│   ├── tok_eval.py                 # Tokenizer: evaluate compression rate
│   └── tok_train.py                # Tokenizer: train it
├── tasks
│   ├── arc.py                      # Multiple choice science questions
│   ├── common.py                   # TaskMixture | TaskSequence
│   ├── customjson.py               # Make Task from arbitrary jsonl convos
│   ├── gsm8k.py                    # 8K Grade School Math questions
│   ├── humaneval.py                # Misnomer; Simple Python coding task
│   ├── mmlu.py                     # Multiple choice questions, broad topics
│   ├── smoltalk.py                 # Conglomerate dataset of SmolTalk from HF
│   └── spellingbee.py              # Task teaching model to spell/count letters
├── tests
│   └── test_engine.py
└── uv.lock
```

## Contributing

The goal of nanochat is to improve the state of the art in micro models that are accessible to work with end to end on budgets of < $1000 dollars. Accessibility is about overall cost but also about cognitive complexity - nanochat is not an exhaustively configurable LLM "framework"; there are no giant configuration objects, model factories, or if-then-else monsters in the code base. It is a single, cohesive, minimal, readable, hackable, maximally-forkable "strong baseline" codebase designed to run start to end and produce a ChatGPT model you can talk to. Currently, the most interesting part personally is speeding up the latency to GPT-2 (i.e. getting a CORE score above 0.256525). Currently this takes ~3 hours, but by improving the pretraining stage we can improve this further.

Current AI policy: disclosure. When submitting a PR, please declare any parts that had substantial LLM contribution and that you have not written or that you do not fully understand.

## Acknowledgements

- The name (nanochat) derives from my earlier project [nanoGPT](https://github.com/karpathy/nanoGPT), which only covered pretraining.
- nanochat is also inspired by [modded-nanoGPT](https://github.com/KellerJordan/modded-nanogpt), which gamified the nanoGPT repo with clear metrics and a leaderboard, and borrows a lot of its ideas and some implementation for pretraining.
- Thank you to [HuggingFace](https://huggingface.co/) for fineweb and smoltalk.
- Thank you [Lambda](https://lambda.ai/service/gpu-cloud) for the compute used in developing this project.
- Thank you to chief LLM whisperer 🧙‍♂️ Alec Radford for advice/guidance.
- Thank you to the repo czar Sofie [@svlandeg](https://github.com/svlandeg) for help with managing issues, pull requests and discussions of nanochat.

## Cite

If you find nanochat helpful in your research cite simply as:

```bibtex
@misc{nanochat,
  author = {Andrej Karpathy},
  title = {nanochat: The best ChatGPT that \$100 can buy},
  year = {2025},
  publisher = {GitHub},
  url = {https://github.com/karpathy/nanochat}
}
```

## License

MIT
```

### `dev/LEADERBOARD.md`

```markdown
# Leaderboard

Docs on participating in the "Time-to-GPT-2" leaderboard of nanochat.

The primary metric we care about is "time to GPT-2" - the wall clock time needed to outperform the GPT-2 (1.6B) CORE metric on an 8XH100 GPU node. Originally in 2019, GPT-2 was trained by OpenAI on 32 TPU v3 chips for 168 hours (7 days), with $8/hour/TPUv3 back then, for a total cost of approx. $43K. It achieves 0.256525 CORE score, which is an ensemble metric introduced in the DCLM paper over 22 evaluations like ARC/MMLU/etc.

## How to

The script [runs/speedrun.sh](runs/speedrun.sh) always implements the current state of the art on the leaderboard.

In practice, I tune the base_train command a little bit. For example, once all the setup is configured and a tokenizer is trained, I like to do something like:

```
OMP_NUM_THREADS=1 torchrun --standalone --nproc_per_node=8 -m scripts.base_train -- \
    --depth=26 \
    --run="d26-feb2-fp8-ratio8.25" \
    --model-tag="d26_feb2_fp8_ratio8.25" \
    --device-batch-size=16 \
    --sample-every=-1 \
    --save-every=-1 \
    --core-metric-max-per-task=-1 \
    --core-metric-every=999999 \
    --target-param-data-ratio=8.25 \
    --fp8
```

Note that:

- `depth` controls the size of the Transformer
- `run` is the wandb name
- `model-tag` is the location of the checkpoints on disk
- `device-batch-size` in the ideal world, you want this to be 32 because with sequence length of 2048 (the default) and 8 GPUs we get `32 X 2048 X 8 = 524,288`, which is the total desired batch size determined to work fairly well around this scale. However, for bigger (e.g. d26), 32 is too much and OOMs, so we decrease it by 2 to 16. The `base_train.py` script automatically compensates for this by calculating that it has to use gradient accumulation of 2 to meet the desired total batch size. Therefore, it will do forward+backward twice and then a single step. Long story short, the ideal value is 32. If that doesn't fit, you decrease it, e.g. 16, 8, etc., keeping it powers of two so that the gradient accumulation math works out neatly.
- `sample-every = -1` turns off periodic sampling
- `core-metric-max-per-task=-1` means we run the entire CORE eval
- `core-metric-every=999999` a bit of a hacky way to make the CORE eval only happen a single time at the very end of the run
- `target-param-data-ratio=8.25` controls the training horizon, which is determined in the script by taking the number of non-embedding model parameters and simply multiplying by this number. The current optimal Tokens:Params ratio can be seen in the defaults of the `base_train.py` script (it is 10.5). 10.5 would produce the *compute optimal* model given the currently measured scaling laws. However, GPT-2 capability is currently somewhere in between a d24 and d26. So to reach it exactly, we want to either overtrain d24 or undertrain d26. In this particular example, I am choosing to slightly undertrain a d26. Note that odd depths (e.g. d25) are not super recommended to use because the math around the transformer sizing and its head dimensions doesn't come out neatly.
- `--fp8` turns on fp8 training. If your GPU does not support fp8, you can leave this out and the code will simply train in bf16. bf16 is higher precision than fp8, so you can actually expect that you might be able to do fewer steps (lower the `target-param-data-ratio`) to achieve the same capability.

Once you kick off the run, you wait ~1.5 hours and then at the end you'll see something like:

```
wandb: Run summary:
wandb:          core_metric 0.25851
wandb:                 step 16704
wandb: total_training_flops 4.330784131228946e+19
wandb:  total_training_time 10949.46713
```

Your CORE metric must be greater than GPT-2 0.256525. Then you report the `total_training_time`, (e.g. 10949) which is the time of the training iterations alone, excluding all the evaluations and logging, in seconds. So here for example it is roughly 10949/60/60 ~= 3.04 hours. You should also note and report the validation bpb of your run because the CORE metric can be a little bit noisy.

If you outperform GPT-2 and the time is less than current SOTA in the Leaderboard, you get to make a PR. In addition to raw gains, there are some qualitative and aesthetic considerations that go into whether your improvement is merged. For example, if it is gnarly or it significantly bloats the code, or it seems too esoteric, then we will weigh those things against the improvement demonstrated. Additionally, nanochat cares not only about targeting a single model, but an entire miniseries of models. So your change must be principled enough that it can easily generalize to other model depths, so that we can sweep out a miniseries.

After you create the commit, to get the current short git commit hash:

```
git log -1 --format="%h"
```

## Run 1

Achieved Jan 29 2026 on commit `348fbb3`. The launch command was

```
OMP_NUM_THREADS=1 torchrun --standalone --nproc_per_node=8 -m scripts.base_train -- \
    --depth=24 \
    --run=d24-jan29 \
    --model-tag=d24_jan29 \
    --device-batch-size=16 \
    --sample-every=-1 \
    --save-every=-1 \
    --core-metric-max-per-task=-1 \
    --core-metric-every=3000 \
    --target-param-data-ratio=12
```

The result was:

```
wandb: Run summary:
wandb:          core_metric 0.25851
wandb:                 step 16704
wandb: total_training_flops 4.330784131228946e+19
wandb:  total_training_time 10949.46713
```

The validation bpb was 0.74833.

Detailed writeup: [Beating GPT-2 for <<$100: the nanochat journey](https://github.com/karpathy/nanochat/discussions/481)

## Run 2

Achieved Feb 2 2026 on commit `a67eba3`. The launch command was

```
OMP_NUM_THREADS=1 torchrun --standalone --nproc_per_node=8 -m scripts.base_train -- \
    --depth=26 \
    --run="d26-feb2-fp8-ratio8.5" \
    --model-tag="d26_feb2_fp8_ratio8.5" \
    --device-batch-size=16 \
    --sample-every=-1 \
    --save-every=-1 \
    --core-metric-max-per-task=-1 \
    --core-metric-every=999999 \
    --target-param-data-ratio=8.5 \
    --fp8
```

The result was:

```
core_metric 0.2578
step 14889
total_training_time 10493
Minimum validation bpb: 0.745036
```

The big change in this run is `--fp8`, which causes all Linear layers (other than the gates) to be switched to fp8 training using `torchao` with tensorwise fp8 scaling. Each step is of slightly lower quality, but we are taking them a lot faster, coming out net ahead. Anyone who does not have fp8 (e.g. using a GPU without it) can simply leave out the `--fp8` flag to train in bfloat16. This will work just fine but it will produce a slightly stronger model than GPT-2 because of the fp8 -> bf16 precision upgrade. It's possible that one can further tune which layers to include in the fp8 conversion and that e.g. some of the smaller matmuls should be just kept in bf16 etc.

Previous record was 3.04 hours, so 2.91 hours is `(3.04 - 2.91)/3.04*100` ~= 4.3% speed improvement.

## Run 3

Achieved Feb 5 2026 on commit `2c062aa`. Launch command:

```
OMP_NUM_THREADS=1 torchrun --standalone --nproc_per_node=8 -m scripts.base_train -- \
    --depth=26 \
    --run="d26_feb4_double_batch_ratio8.25" \
    --model-tag="d26_feb4_double_batch_ratio8.25" \
    --device-batch-size=16 \
    --total-batch-size=1048576 \
    --sample-every=-1 \
    --save-every=-1 \
    --core-metric-max-per-task=-1 \
    --core-metric-every=999999 \
    --target-param-data-ratio=8.25 \
    --fp8
```

Result:

```
core_metric 0.26024
step 7226
total_training_time 9922
Minimum validation bpb: 0.74645
```

The big change here is that the batch size was doubled from 0.5M to 1M, which works better for a d26 model and allowed me to decrease the number of optimization steps a bit via `--target-param-data-ratio` from 8.5 to 8.25. The TLDR is that the original batch size of 0.5M was tuned for d12, but bigger models (e.g. d26) prefer larger total batch size. I determined in experiments that d26 prefers 1M. Then I implemented and merged a principled way to calculate the optimal batch size given depth so that all nanochat models of all depths benefit. See [dev/LOG.md](dev/LOG.md) entry "2026-02-05: Auto Batch Size Scaling" for more detail.

## Run 4

Achived Mar 3 2026 on commit `324e69c`. The big change is the switch from HuggingFace FineWeb-EDU to NVIDIA ClimbMix dataset. `@karpathy` has tried to swap the dataset many times, each time with a negative result (FineWeb, DCLM, Olmo), but ClimbMix produced clear and immediate gains. Credit to `@ddudek` for originally discovering ClimbMix for nanochat and reporting the improvements, which kicked off the followup investigation.

To reproduce, use the commit above, download at least 150 data shards, train the tokenizer:

```
python -m nanochat.dataset -n 150
python -m scripts.tok_train
```

Then kick off the run in the typical way, using a slightly lower than compute optimal ratio of 9.5 (vs compute optimal 10.5), meaning the d24 is slightly undertrained.

```
OMP_NUM_THREADS=1 torchrun --standalone --nproc_per_node=8 -m scripts.base_train -- \
    --depth=24 \
    --run="d24-climbmix" \
    --model-tag="d24-climbmix" \
    --sample-every=-1 \
    --save-every=-1 \
    --core-metric-max-per-task=-1 \
    --core-metric-every=999999 \
    --target-param-data-ratio=9.5 \
    --device-batch-size=16 \
    --fp8
```

I ran this command 7 individual times. Because our training is mildly non-deterministic, we get a spread of CORE scores, e.g.:

```
0.25373
0.2584
0.25489
0.2568
0.25732
0.26765
0.25119
```

Mean is 0.25714 (higher than the GPT-2 threshold needed), max-min is 0.01646. Something to investigate in the future is that even slightly better results can be obtained by randomly shuffling the the data shards (i.e. just going in a different order). This is unexpected because the documents were completely fully shuffled during data construction, so one would expect a relatively uniform data distribution. Indeed, the current default order is unfortunately among the worse ("unlucky") ones you can obtain with different shuffle seeds, but it suffices to beat GPT-2 for now so I am merging. TODO investing a bit more later.

NOTE: The `val_bpb` is as of this run *NOT* comparable due to the data distribution change to the previous 3 runs. This run happens to be at `0.71854` validation bpb. If the dataset is not changed, the `val_bpb` number is a great, smooth metric to track relative performance w.r.t. and has less noise than CORE.

## Run 5

Achieved Mar 9, 2026 on commit `6ed7d1d`. Exactly the same launch command as Run 4 except `--target-param-data-ratio=8.7`. I ran 5 identical runs, the average CORE was 0.2690, which is quite a bit above the needed threshold of 0.2565. But the reason I didn't decrease the ratio further (i.e. train shorter) is that while the CORE "safety gap" is large, the val_loss safety gap is smaller - 0.71808, which we want to be below the Run 4 val loss of 0.71854. It's likely that we could have reduced the ratio even lower, possibly to 8.6, but it's not worth splitting hairs at this point.

This commit is special because all of the improvements that went into [this commit](https://github.com/karpathy/nanochat/commit/6ed7d1d82cee16c2e26f45d559ad3338447a6c1b) came from fully autonomous "research" done by a private version of [autoresearch](https://github.com/karpathy/autoresearch) run on a d12 model. I wrote more about this in [this tweet](https://x.com/karpathy/status/2031135152349524125). The changes easily translated from d12 to d24, hence new leaderboard record, taking us from 2.02 hours "time to GPT-2" to 1.80 hours.

## Run 6

Achieved Mar 14, 2026 on commit `a825e63`. Exactly the same launch command as Run 4 except `--target-param-data-ratio=8`. Improvements in the architecture are allowing us to train shorter and shorter time. Instead of an undertrained d24 I attempted to train an overtrained d22 but it was worse. This set of changes came from autoresearch round 2, where I asked it to reference the modded-nanogpt repo for inspiration. So the exploration tried out a number of ideas and in particular found a way to incorporate the backout and smear in such a way that they are helpful (I had previously tried them manually a long time ago and they caused regressions). The smear idea in particular is a little bit heavier and bloaty because it is essentially an "early fusion" of context across tokens, producing a kind of a bigram input into the network and allowing it to focus on higher ngrams earlier. But for this reason the code gets a bit more complex and required some changes to inference. I verified with a unit test that the Engine inference is correct compared to the naive inference of `GPT.generate()`. The average of 5 runs was CORE 0.262634 and each of them lasted 1.65 hours (99 minutes).
```

### `dev/LOG.md`

```markdown
# Experiment Log

A running summary documenting some experiments and findings. Started ~Jan 7 2026.

---

## 2026-03-24: Parameter-Golf Ideas Sweep (Negative)

Reviewed `openai/parameter-golf` for small/simple ideas that might transfer to nanochat pretraining without bloating the codebase. Cached notes are in `knowledge/parameter_golf.md`.

### Rationale

The parameter-golf leaderboard is a useful source of:

- tiny architecture tweaks
- short-run optimizer/schedule tricks
- Muon-related systems ideas

But much of that repo is optimized for a very different objective:

- fit in a 16MB artifact
- train in under 10 minutes on 8xH100
- evaluate on compression / bpb

So only a small subset of ideas looked worth trying in nanochat.

### Ideas Tried

**1. LeakyReLU(0.5)^2**
- Replaced `relu^2` in the MLP with `leaky_relu(x, 0.5)^2`
- **Result:** Slightly better per-step quality, but slightly slower. Net worse on wall clock.

**2. Partial RoPE**
- Applied rotary embeddings to only the first quarter of each head dimension
- **Result:** Slightly worse.

**3. LN Scale**
- Multiplied each block's normalized input by `1/sqrt(layer_idx+1)` before attention and MLP
- **Result:** Did not help.

**4. Orthogonal init**
- Switched the non-zero transformer matrices to orthogonal init while preserving zero-init output projections
- **Result:** Did not help.

**5. XSA (Exclusive Self Attention)**
- Implemented XSA on the deepest 3 non-VE layers only, so it projected against the plain `v` path rather than `v + VE`
- **Result:** Slightly better step quality but not wall clock. Not worth the extra compute in the hot attention path.

### Notes

- EMA/SWA had already been tried earlier (I skipped recording it) and did not help.
- Bigram hash embeddings had already been explored much earlier and did help somewhat, but the added parameters / VRAM / complexity were not justified at larger scale. See the Jan 27-28 entries above.

### Conclusion

This pass did not find any cheap parameter-golf transfer that clearly improves nanochat on the metric that matters: wall clock time to capability.

---

## 2026-03-04: Remove autocast, explicit dtype management, fp16 GradScaler

Replaced `torch.amp.autocast` throughout the codebase with explicit dtype management via a single `COMPUTE_DTYPE` global. Also added fp16 training support with GradScaler.

### Motivation

autocast is "magic we don't control" — it silently decides which ops run in which precision via internal allowlists. For this codebase, autocast was doing very little: the only thing it actually cast was `nn.Linear` weights from fp32 to bf16 for matmuls. `F.rms_norm`, `F.cross_entropy`, and Flash Attention all handle their own dtypes already. By making precision explicit, we gain fine-grained control (e.g. can experiment with fp32 norms) and eliminate an unnecessary layer of abstraction.

### What changed

**Core mechanism** (`nanochat/common.py`, `nanochat/gpt.py`):
- `COMPUTE_DTYPE` auto-detected from hardware: SM 80+ → bf16, pre-Ampere → fp32, CPU/MPS → fp32. Override via `NANOCHAT_DTYPE` env var.
- Custom `Linear(nn.Linear)` class that casts weights to match input dtype in forward: `F.linear(x, self.weight.to(dtype=x.dtype))`. This is the single mechanism that replaces autocast.
- Embeddings cast to `COMPUTE_DTYPE` at init (saves memory). Exception: fp16 keeps embeddings fp32 because GradScaler cannot unscale fp16 gradients.
- Embedding output explicitly cast to `COMPUTE_DTYPE` in `GPT.forward()` (no-op for bf16, active for fp16 path).
- RoPE cos/sin cache uses `COMPUTE_DTYPE` instead of hardcoded bf16.

**Autocast removal** (11 files):
- Deleted `--dtype` CLI flag, `ptdtype` variables, `autocast_ctx` definitions, and all `with autocast_ctx:` blocks from: `base_train.py`, `chat_sft.py`, `chat_rl.py`, `chat_cli.py`, `chat_eval.py`, `chat_web.py`, `base_eval.py`, `engine.py`, `bench_train_toks.py`, `test_e2e_pipeline.py`.

**fp16 + GradScaler** (`base_train.py`, `chat_sft.py`):
- `scaler = torch.amp.GradScaler() if COMPUTE_DTYPE == torch.float16 else None`
- Backward: `scaler.scale(loss).backward()` vs plain `loss.backward()`
- After accumulation: `scaler.unscale_(optimizer)` → distributed inf-sync via `scaler._found_inf_per_device(optimizer)` all-reduced with `ReduceOp.MAX` → `scaler.step(optimizer)` → `scaler.update()`
- Zero overhead for bf16/fp32 paths (scaler is None, no branching inside kernels).

**FP8 fix** (`nanochat/fp8.py`, `base_train.py`):
- `Float8Linear.forward` explicitly casts input to `COMPUTE_DTYPE` (previously relied on autocast).
- `disable_fp8` context manager now creates our custom `Linear` (not vanilla `nn.Linear`) when swapping out Float8Linear during eval.

**Flash Attention** (`flash_attention.py`):
- FA3 Hopper kernels don't support fp16 or fp32, so `USE_FA3` (module-level constant, resolved once at import) returns False, falling back to SDPA.

---

## 2026-03-04: Dataset upgrade: FineWeb-EDU 100B → ClimbMix 400B

Switched the pretraining dataset from FineWeb-EDU 100B to ClimbMix 400B. This is by far the single biggest improvement to nanochat's GPT-2 speedrun time, bringing it down from **2 hours 46 minutes to 2 hours 1 minute** — a 27% reduction.

### What is ClimbMix?

ClimbMix 400B is a curated 400B-token pretraining mixture hosted at `karpathy/climbmix-400b-shuffle` on HuggingFace. It comes form [NVIDIA](https://huggingface.co/datasets/nvidia/Nemotron-ClimbMix). It is a blend of high-quality web text, code, math, and other sources, designed to be a better general-purpose pretraining dataset than FineWeb-EDU alone.

### What changed

- **Dataset**: `karpathy/fineweb-edu-100b-shuffle` → `karpathy/climbmix-400b-shuffle` (up to 6543 shards available vs the previous 1823 data shards, allowing for longer training in the future)
- **Data directory**: `base_data/` → `base_data_climbmix/` (clean separation from legacy data)
- **Model depth**: d26 → d24. ClimbMix trains more efficiently, so a smaller model reaches GPT-2 capability
- **Shard count**: Only approx 150 data shards (~7B tokens) are now needed for GPT-2 capability
- **Eval tokens**: doubled from 40 to 80 batches for more stable validation loss estimates
- **Legacy fallback**: added a migration warning in `list_parquet_files()` that detects the old `base_data/` directory and falls back gracefully, so existing users see clear upgrade instructions on `git pull`

### Context

This is the sixth attempt at beating FineWeb-EDU on CORE score — the previous five all failed (see entries on 2026-02-17, 2026-02-10, 2026-01-12 below). ClimbMix is the first dataset to convincingly surpass it, and the margin is large enough to also shrink the model from d26 to d24.

---

## 2026-03-02: SoftCap tuning

Quick experiment to tune logit softcap on d24 scale. Tried 5..30. 5 was terrible, the rest of them were all about equal with the exception of 20, which was the best. Minor but solid improvement: val loss improved by ~1e-3 (0.716 -> 0.715). Setting as default.

## 2026-02-19: Mixture of Experts (negative)

Implemented a DeepSeekV3-style Mixture of Experts layer as a drop-in replacement for the dense MLP. The MoE branch works and improves per-step validation loss, but is not a net improvement on wall clock time due to MoE overhead (at least for our scale of interest of approx GPT-2 capability).

### Implementation

Follows DeepSeekV3 and using torchtitan as reference:

- **8 routed experts, top-2 routing** with sigmoid gating (not softmax)
- **1 shared expert** (dense MLP processing all tokens, following DeepSeekV3)
- **Auxiliary-loss-free load balancing** (DeepSeekV3's expert bias nudging)
- **Iso-FLOP sizing**: `expert_hidden_dim = round(4 * dim / (top_k + num_shared) / 128) * 128`, so active FLOPs per token match the dense MLP
- **`torch._grouped_mm`** for dispatching tokens to experts in a single kernel (instead of a Python for-loop)
- **3D expert weight tensors** `(num_experts, hidden, dim)` — Muon's Polar Express operates on the last two dims, so each expert is independently orthogonalized
- **Active parameter counting** for scaling laws (only `top_k + shared` experts, not all 8)

### What was easy

- The core MoE forward pass: router, sort tokens by expert, grouped matmul, scatter back. Conceptually clean.
- Shared expert: just an `nn.Linear` MLP that runs on all tokens alongside the routed path.
- 3D expert params + Muon: only required fixing `second_momentum_buffer` shape to preserve leading dims.
- Load balancing: DeepSeekV3's bias nudging is simple and effective (~10 lines).

### What was hard / ugly

- **`torch._grouped_mm` quirks**: requires bf16 (not fp32), column-major right operand, int32 cumulative offsets. The API is undocumented and only discoverable by trial and error.
- **Token count padding**: torchtitan pads each expert's token count to alignment multiples (8 for bf16) for better grouped_mm throughput. We implemented this with both a pure PyTorch approach and a copy of torchtitan's Triton kernel. Both compiled cleanly (0 graph breaks), but with ~65K tokens across 8 experts, each expert already gets ~8K tokens which is well-aligned. The padding overhead (gather/scatter) actually regressed MFU from 35% to 33%. Reverted.
- **FP8 + MoE**: `torch._grouped_mm` does NOT support FP8. There's a separate `torch._scaled_grouped_mm` API that requires per-row scaling (not per-tensor like our `Float8Linear`). The backward pass for weight gradients needs per-group column-wise scaling, which torchao implements with custom Triton kernels. We investigated thoroughly (see `dev/moe_fp8.md`) but did not implement — would require either depending on `torchao.prototype` (unstable) or writing ~200 lines of custom autograd + quantization code. Partial FP8 support exists: the shared expert's `nn.Linear` layers do get converted, but the routed experts (3D `nn.Parameter`) stay in bf16.

### Results

- d18: MFU dropped from ~46% to ~35% (the grouped_mm dispatch + token sorting overhead is significant)
- Per-step improvement in validation loss does not compensate for the throughput hit
- Net negative on wall clock time

### What remains (if revisited)

- **FP8 for routed experts**: Use `torch._scaled_grouped_mm` with a custom `_Float8GroupedMatmul` autograd function, with bf16 fallback for weight gradient (avoiding the per-group column-wise Triton kernels).

What's really needed is a fused "FlashMoE" kernel that handles routing + expert dispatch + matmul in one shot (like FlashAttention did for attention), with all the needed features. This doesn't exist yet. Rawdogging MoE with current PyTorch primitives is painful — lots of sorting, gathering, scattering, and layout wrangling around the actual compute.

### Verdict

MoE is not worth the trouble for nanochat right now. The code bloat is substantial (moe.py, router, shared expert, load balancing, optimizer fixes, FP8 gaps, active param counting) and the performance is worse wall-clock at our scale of interest. The fundamental issue is that the grouped_mm dispatch overhead eats the FLOP savings from sparsity, at least at our model scales and sequence lengths.

---

## 2026-02-17: Pretraining Data: FineWeb (negative)

Tried vanilla fineweb instead of fineweb-edu dataset. Significantly, shockingly worse results:

- d26 (GPT-2): CORE 0.2602 → 0.2241

This is the fifth failed attempt to beat pure FineWeb-EDU on CORE score.

---

## 2026-02-17: Pretraining Data Mixture Experiment (negative)

Tried [hynky/finepdfs_50BT-dclm_30BT-fineweb_edu_20BT](https://huggingface.co/datasets/hynky/finepdfs_50BT-dclm_30BT-fineweb_edu_20BT), a mixture of FinePDFs, DCLM, and FineWeb-EDU. Slightly worse on both model sizes tested:

- d26 (GPT-2): CORE 0.2602 → 0.2549
- d18: CORE 0.199 → 0.192

This is the fourth failed attempt to beat pure FineWeb-EDU on CORE score.

---

## 2026-02-16: SFT Script Upgrades

Brought `chat_sft.py` up to parity with `base_train.py` and tuned settings based on SFT sweeps.

Tuning:

- **Optimizer warm-start** (`--load-optimizer=1`, default on): loads pretrained momentum buffers via new `load_optimizer_state()` in `checkpoint_manager.py`. LRs are reset to fresh SFT values after load. Loading the optimizer works slightly better but not by too much.
- **LR schedule**: replaced "constant 80%, linear to 0" with warmup/constant/warmdown matching `base_train.py` (`--warmup-ratio`, `--warmdown-ratio`, `--init-lr-frac`, `--final-lr-frac`). Similar to pretraining, warmdown ratio of 0.5 worked the best. `--init-lr-frac` changed from 1.0 slightly lower to 0.8.
- **LR tuning**: attempted to tune all the individual LRs (e.g. does SFT prefer lower LR for embeddings? etc.) but all of this produced negative results.
- **Data mixture**: MMLU epochs 1→3, GSM8K epochs 2→4 (confirmed best from sweeps). Epoch counts now configurable via `--mmlu-epochs` / `--gsm8k-epochs`. Might remove these in the future though.

Quality of life, footguns, minor fixes:

- **Hyperparameter inheritance**: SFT now inherits batch sizes and LRs from the pretrained checkpoint metadata by default (CLI overrides still work). Also saved `total_batch_size` to `base_train.py` checkpoint metadata.
- **GC management**: disabled Python GC after step 1 to avoid ~500ms pauses (manual collect every 5000 steps), same as base pretraining.
- **ChatCORE eval**: periodic eval during SFT (`--chatcore-every=200`) across all 6 tasks, logged to wandb.
- **MFU**: uses `get_peak_flops()` for actual GPU instead of hardcoded H100 value.
- Removed `--dry-run` and `--dtype` flags. All ranks now participate in checkpoint save.

---

## 2026-02-05: Auto Batch Size Scaling

### Background

So far, the `--total-batch-size` was hardcoded to be `2**19 = 524,288` ~= 0.5M tokens. This was the optimal setting for d12, but when I tried to re-tune it for d26 (GPT-2), I noticed that the optimal was closer to `2**20 = 1,048,576` ~= 1M tokens. This is to be expected - larger models prefer a higher optimal total batch size. However, we have to make sure that all settings of `--depth` get their own optimal batch size calculated in some principled way. Here, I referenced the "Power Lines" paper from Cerebras ([arXiv:2505.13738](https://arxiv.org/abs/2505.13738)) for a lot of related experimentation. In particular, they found that **Bopt ∝ D^0.383** (where D is the number of training tokens, not the number of parameters!). So the idea is to tune the optimal batch size on d12, and then extrapolate it with this power law to bigger models. The 0.383 exponent means batch size grows slowly: 10× more tokens only justifies ~2.4× bigger batch. For nanochat's compute-optimal training (D ∝ N via `--target-param-data-ratio`), this means deeper models naturally want larger batches.

### Implementation

Added `--total-batch-size=-1` (now the default) to auto-compute optimal batch:

```python
get_scaling_params = lambda m: m.num_scaling_params()['transformer_matrices'] + m.num_scaling_params()['lm_head']
if args.total_batch_size == -1:
    D_REF = args.target_param_data_ratio * get_scaling_params(build_model_meta(12))
    B_REF = 2**19
    args.total_batch_size = 2 ** round(math.log2(B_REF * (target_tokens / D_REF) ** 0.383))
```

Reference point: d=12 model with B=2^19 (empirically validated). The reference is computed dynamically so that if the architecture changes (e.g., different `--aspect-ratio`), the math automatically adjusts. However, if the model actually does change too much, one would also want to re-tune the optimal batch size for d=12.

### Results

With this formula, we currently get:

| Depth | Scaling Params | Target Tokens | Auto Batch |
|-------|---------------|---------------|------------|
| d=8   | 42M           | 0.44B         | 2^18 = 262K |
| d=10-16 | 70M-235M    | 0.7B-2.5B     | 2^19 = 524K |
| d=18-26 | 324M-918M   | 3.4B-9.6B     | 2^20 = 1.05M |
| d=32-50 | 1.7B-6.2B   | 17.6B-65.6B   | 2^21 = 2.1M |

In particular, this matches empirical observations that d26 prefers ~2^20 while d12 prefers ~2^19.

### Code Cleanup

Also refactored model initialization to use `build_model_meta(depth)` helper and `dataclasses.asdict()` for cleaner config handling.

### Useful references

- [Bergsma et al., Power Laws for Batch Size, Model Size, and Training Horizon](https://arxiv.org/abs/2505.13738)
- [McCandlish et al., An Empirical Model of Large-Batch Training](https://arxiv.org/abs/1812.06162)
- [Brown et al., Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
- [Merrill et al., The Batch Size–Critical Batch Size Myth](https://arxiv.org/abs/2505.23971)

### One more thing (batch size ramp)

Tried batch size ramping. The simplest implementation I could think of "tricks" the existing training loop by slicing each micro-batch into smaller pieces and calling optimizer.step() more frequently early in training (1/8 → 1/4 → 1/2 → full batch over the first x% of training, with sqrt LR scaling). Also required a torch.compile warmup phase to pre-compile all slice sizes and avoid recompilation spikes during training. While the idea is sound and small gains were observed, they weren't sufficient to justify the code complexity introduced (conditional slicing logic, warmup with state save/restore, etc.). Not merged for now.

---

## 2026-02-05: SwiGLU Activation (Negative Result)

Replaced ReLU² MLP activation with SwiGLU (inspired by [twitter](https://x.com/_xjdr/status/2019141521690567058)). SwiGLU uses three projections instead of two, so to match parameters and FLOPs we scale hidden_dim from 4× to 8/3×:

```python
# Old ReLU²: 2 matrices, 4x expansion
#   params: 2 × n × 4n = 8n²
#   flops:  2 × 2n × 4n = 16n² per token
self.c_fc   = Linear(n_embd, 4 * n_embd)
self.c_proj = Linear(4 * n_embd, n_embd)
x = c_proj(relu(c_fc(x)).square())

# New SwiGLU: 3 matrices, 8/3x expansion
#   params: 2 × n × (8n/3) + (8n/3) × n = 8n²  ✓ matches
#   flops:  3 × 2n × (8n/3) = 16n² per token   ✓ matches
hidden_dim = (8 * n_embd) // 3
self.w1 = Linear(n_embd, hidden_dim)  # gate
self.w2 = Linear(n_embd, hidden_dim)  # up
self.w3 = Linear(hidden_dim, n_embd)  # down
x = w3(silu(w1(x)) * w2(x))
```

Tested at both d12 and d24 (GPT-2 scale). Worse on all measures — step efficiency, wall clock time, and FLOPs. ReLU² remains superior for nanochat. **Not adopted.**

---

## 2026-02-03: Flip Muon MLP LR Multiplier (PR #492)

Tested flipping the shape-based LR heuristic in Muon from boosting tall matrices (input projections like `c_fc`) to boosting wide matrices (output projections like `c_proj`). The original code applies `max(1, rows/cols)^0.5`, giving ~2x LR to `c_fc`. The flipped version gives ~2x LR to `c_proj` instead, which aligns with classical fan-in/fan-out scaling conventions. This was proposed in [PR #492](https://github.com/karpathy/nanochat/pull/492) and showed improvements in modded-nanogpt.

**Result:** Quick d12 experiment: slightly worse **Not adopted.**

---

## 2026-02-03: Skip AdamW Every Other Step

Inspired by modded-nanogpt, tried stepping AdamW only on odd iterations while Muon steps every iteration. The idea is that small AdamW params (embeddings, scalars, gates) don't need updates as frequently as the large weight matrices, and skipping saves both compute and communication.

Added `skip_adamw` parameter to `MuonAdamW.step()` and `DistMuonAdamW.step()` plus a matching `zero_grad(skip_adamw=...)` to let AdamW gradients accumulate over 2 steps. Used `lr *= 2**-0.5` (sqrt scaling) to compensate for the 2x effective batch size on AdamW params.

**Result:** for nanochat d12, we see ~2% faster tok/s, but each step is slightly worse in loss. On net, when plotting against wall clock time, it's slightly worse. **Not adopted.**

---

## 2026-02-02: FP8 Training with torchao

Integrated FP8 training using `torchao.float8` to accelerate Linear layer matmuls on H100 GPUs.

### Background

FP8 (8-bit floating point) uses H100's FP8 tensor cores for ~2x theoretical matmul throughput. The tradeoff is quantization overhead: computing scales and casting tensors to/from FP8. Still, as an example torchtitan (Meta's distributed training framework) reports 25-28% speedups with FP8 for some of their experiments.

**Previous attempt (Jan 2026):** FP8 on just `lm_head` following modded-nanogpt with custom ops → 1% speedup, +2GB memory. Failed due to fragile torch.compile interaction. But this experiment was also done on ~d12 scale back then instead of the bigger model that gets GPT-2 capability of approx d24.

**This attempt:** Use torchao's `convert_to_float8_training()` on ALL Linear layers, increase model size to d24. The core snippet is:

```python
from torchao.float8 import Float8LinearConfig, convert_to_float8_training
config = Float8LinearConfig.from_recipe_name("tensorwise")
convert_to_float8_training(model, config=config)
```

But in practice it's more involved (see base_train.py).

### Results

**Microbenchmark (d26 MLP, 65536x1664 @ 1664x6656):**

| Method | Forward | Fwd+Bwd | Speedup |
|--------|---------|---------|---------|
| BF16 + compile | 2.00ms | 4.79ms | 1.00x |
| FP8 rowwise + compile | 1.84ms | 4.55ms | 1.08x |
| FP8 tensorwise + compile | 1.45ms | 4.06ms | **1.38x** |
| FP8 rowwise (no compile) | 2.89ms | 21.86ms | 0.23x ❌ |

torch.compile is MANDATORY. Without it, FP8 is 4x slower due to unfused scaling ops.

**Full training (d26):**

| Config | tok/sec | vs baseline |
|--------|---------|-------------|
| BF16 baseline | 630K | 1.00x |
| FP8 rowwise | 564K | 0.90x ❌ |
| FP8 tensorwise | 740K | **1.17x** ✓ |

Memory usage also decreases quite a bit, by ~9GB (activations stored as FP8 instead of BF16).

Seeing 17% speedup is encouraging but we're still not done yet because each step is now in lower precision and less powerful individually, so to make up for the precision drop we have to train longer. Empirically, running some sweeps overnight on d24 scale, I saw that the actual speedup (when you match performance) is closer to 5%. It's possible that our LLMs at ~d24 scale are still too small to confidently enjoy the speedups that come from fp8 for bigger models.

### Key Learnings

For nanochat at approximate scale of interest (~GPT-2 capability, ~d24):

1. **Tensorwise >> Rowwise** - Rowwise computes per-row scales, overhead exceeds benefit. Tensorwise uses one scale per tensor.
2. **Filter small layers** - Layers with dims not divisible by 16 must be skipped (FP8 hardware requirement)
3. **Larger models benefit more** - d12 was still slower with FP8; d26+ shows gains. Therefore, in some depths there is a benefit to fp8 and in some there isn't. Keeping it configurable for now, passed in via kwargs and default off.
4. **The effective, capability-matched speedup is lower still** - because each step is of slightly lower precision/quality.

### Integration

Added `--fp8` flag to `base_train.py`, default recipe is "tensorwise", example of turning on:

```bash
torchrun --nproc_per_node=8 -m scripts.base_train --depth=24 --fp8
```

Uses tensorwise by default. Requires `torchao==0.15.0` (compatible with torch 2.9.1), which was added to dependencies.

**TLDR**: turning on fp8 for GPT-2 capability nanochat model gives approx +5% capability-matched speedup.

---

## 2026-01-29: Hyperball/MuonH Experiments (Negative Result)

Explored Hyperball optimization from [this post](https://psychedelic-sunstone-851.notion.site/Fantastic-Pretraining-Optimizers-and-Where-to-Find-Them-2-1-Hyperball-Optimization-2e924306e6f280e7a5ffee00eb40a0dd) (saved to `knowledge/muonh.md`). Constrains weights to sphere of radius R (initial norm): `W_{t+1} = R · Normalize(W_t - η·R · Normalize(u_t))`. Had to change a number of details in a branch, e.g. not use zero init for our projections (or the initial norm would be zero), keep track of the initial norm, adjust Muon -> MuonH for the update.

Experiments on d12:

| Experiment | Result |
|------------|--------|
| MuonH for matrix params | Worse than baseline |
| MuonH + LR sweep (2.5e-3 to 1e-2) | Still worse |
| Added learnable RMSNorm scales (paper says γ preserves expressivity) | Still worse |
| Various RMSNorm init tweaks, e.g. 0 at init to residual | Still worse |
| AdamH for lm_head (paper recommends this) | Broken - loss plateaus (see below) |
| AdamH + learnable output scales | Still worse |

Could not outperform the baseline implementation. The article doesn't go into too much detail on how AdamH is applied to `lm_head` exactly. The classifier layer has to be able to increase in magnitude to make more confident predictions over time. Tried a sensible version with added 0-D learnable scalar, and also with RMSNorms with per-channel learnable scalars both pre and post resnet blocks.

**Result:** This was not an out-of-the-box win for nanochat even with a mild attempt over a few hours at a bit of tuning and debugging. The idea itself is intuitively appealing. Might come back around later to try harder later.

---

## 2026-01-28: Reverted Bigram Hash Embeddings

Removed bigram embeddings (engram-lite) from the codebase. At larger scale (d25), the improvement was tiny and disappeared entirely when measured by wall clock time. It also bloated the VRAM used. The extra parameters and complexity aren't justified.

---

## 2026-01-27: Bigram Hash Embeddings (Engram-lite)

Explored N-gram memory modules inspired by the [DeepSeek Engram paper](https://arxiv.org/abs/2601.07372) and [modded-nanogpt PR #201](https://github.com/KellerJordan/modded-nanogpt/pull/201).

### Background

The Engram paper introduces "conditional memory" as a complement to MoE - using O(1) hash lookups to retrieve static N-gram patterns instead of reconstructing them through computation. Key insight: transformers waste early layers "simulating retrieval through computation" for patterns like named entities and formulaic phrases that could be simple table lookups.

### What We Tried

**1. Full Engram module with context-aware gating (paper design)**
```python
# Hash bigrams to retrieve embeddings, then gate with hidden state
e = embed(hash(prev_token, curr_token))
q = RMSNorm(h)           # hidden state as query
k = RMSNorm(W_k @ e)     # projected embedding as key
v = W_v @ e
α = sigmoid(q · k / √d)  # scalar gate per position
output = α * v
```
- Injected after block 1 (paper found early injection optimal)
- Slight improvement, but quite a bit of complexity added.

**2. Early-layer only injection**
- Only inject bigram signal in first 4 layers (where paper claims static pattern offloading helps most)
- **Result:** Actually hurt performance. The model seems to need uniform injection across all layers.

**3. Trigrams**
- Extended to hash both 2-grams and 3-grams, concatenating embeddings
- **Result:** No improvement over bigrams alone. Dilutes capacity from more frequent 2-gram patterns.

**4. Bigram-only with x0-style injection (modded-nanogpt engram-lite approach)**
- Simple hash: `(36313 * curr) XOR (27191 * prev) mod table_size`
- Zero-init embedding table, learned per-layer lambdas
- Add to residual at every layer: `x = resid_λ[i]*x + x0_λ[i]*x0 + bigram_λ[i]*x0_bigram`
- **Result:** This simple approach works and provides a consistent improvement.

TLDR The winning approach follows modded-nanogpt's "engram-lite", simply adding the following module and feeding its output into the residual branch (gated by a per-layer learnable \lambda) before every single block:

```python
class BigramEmbed(nn.Module):
    def __init__(self, vocab_size, embed_dim, table_multiplier=5):
        self.embed = nn.Embedding(vocab_size * table_multiplier, embed_dim)

    def forward(self, idx):
        h = (36313 * idx[:, 1:]) ^ (27191 * idx[:, :-1]) % (table_size - 1)
        return self.embed(h)
```

As for optimal hyperparameters:

- **Table size:** `vocab_size * 5` (~164K entries for 32K vocab). Swept a number of settings and 5 was optimal.
- **Injection:** Every layer via learned `bigram_lambdas` (init 0.1 was better than 0.0).
- **Normalization:** Also tried adding a `norm()` to the embeddings (mirroring the token embeddings), this was slightly worse.
- **Init:** Zero-init embedding, so starts as identity (tried small noisy init, it's worse)
- **Optimizer:** AdamW with same LR as token embeddings

### Key Learnings

1. **Gating didn't help at our scale.** The paper's context-aware gating mechanism (sigmoid dot-product gate) added parameters and complexity without improvement. modded-nanogpt found the same: "simple direct addition to the residual stream outperformed by a decent margin."

2. **Uniform injection beats early-only.** Despite the paper's finding that early layers benefit most, restricting injection to early layers hurt. The x0-style "add everywhere with learned lambda" pattern works better for our architecture/scale.

3. **Bigrams are sufficient.** Trigrams didn't help - the extra context doesn't pay for the diluted capacity.

4. **Scale matters.** The Engram paper's results are at 27B params with MoE. At our ~100M-1B scale, the simpler approach wins. The elaborate gating mechanism may become useful at larger scales where collision handling matters more.

### Parameters Added

For d12 model with `table_multiplier=5`:
- Bigram embedding: 32768 × 5 × 768 = ~126M params
- Per-layer lambdas: 12 scalars (negligible)

If you're keeping track, we now have *a lot* of parameters, a significant amount of them in embeddings (token embeddings, bigram embeddings, value embeddings). For example, for a d12 we now have:

```
Parameter counts:
wte                     : 25,165,824
bigram_embed            : 125,829,120
value_embeds            : 150,994,944
lm_head                 : 25,165,824
transformer_matrices    : 84,935,808
scalars                 : 36
total                   : 412,091,556
```

In other words, only about a quarter of parameters are now weight projections and the vast majority is embedding tables.

Still, on all axes (steps, wall clock time, flops), this somewhat parameter-bloated architecture beats the baseline and will now become the default.

After adding the engram-lite, I re-ran the scaling laws to determine the new optimal tokens:params ratio. I swept FLOPs in the range 1e18..1e19, exponentially strided in 4 settings (1e18, 2e18, 5e18, 1e19). I looked at a number of ways of determining the effective parameter count for the purposes of the scaling laws. The results looked like this:

```
Kaplan-style (all projections including lm_head and no embeddings)

Optimal configurations (from quadratic fits):
FLOPs        Eff Params      Tokens          Ratio      Val BPB
-----------------------------------------------------------------
1e+18        110,678,115     1,241,505,403   11.2       0.8972
2e+18        167,797,457     1,785,336,422   10.7       0.8616
5e+18        250,650,865     2,642,234,152   10.8       0.8293
1e+19        381,758,347     3,806,871,243   10.3       0.7999

N \propto C^0.54, D \propto C^0.49

Chinchilla-style (all parameters, period.)

Optimal configurations (from quadratic fits):
FLOPs        Eff Params      Tokens          Ratio      Val BPB
-----------------------------------------------------------------
1e+18        416,320,605     1,232,157,011   3.0        0.8974
2e+18        560,239,841     1,763,669,281   3.2        0.8616
5e+18        741,495,903     2,629,909,368   3.6        0.8291
1e+19        988,644,331     3,884,841,895   4.0        0.7999

N \propto C^0.37, D \propto C^0.50

Transformer-only-style (only the projections inside the transformer)

Optimal configurations (from quadratic fits):
FLOPs        Eff Params      Tokens          Ratio      Val BPB
-----------------------------------------------------------------
1e+18        80,259,665      1,315,639,547   17.2       0.8966
2e+18        131,488,566     1,864,134,141   14.5       0.8622
5e+18        220,985,474     2,595,328,843   12.1       0.8302
1e+19        401,213,504     3,328,704,512   8.5        0.7994

N \propto C^0.70, D \propto C^0.41
```

Clearly, the Kaplan-style ratios are most consistent and produce stable ~0.5 exponents for both params and tokens, meaning we can have a single fixed ratio of tokens:params for compute optimal models. This turns out to be about ~10.5, which now becomes the new default.

---

## 2026-01-19 to 2026-01-22: Optimizer Hyperparameter Sweep

Ran ~320 experiments across 6 rounds, scaling from d12→d16→d20 to find optimal optimizer hyperparameters. Added granular per-component control to `setup_optimizers()` — separate LRs and betas for embedding, unembedding, value_embeds, resid_lambdas, x0_lambdas, and Muon matrix params.

### What We Swept
- Learning rates for all 6 parameter groups
- Beta1/beta2 for all 5 AdamW groups
- Muon momentum (start/end), weight decay
- Hundreds of combinations (2-way, 3-way, 4-way, etc.)

### The Journey

**At d12**, found two independent improvement routes:
- **Route A:** emb_lr↑ (0.3→0.4), weight_decay↑ (0.1→0.15), matrix_lr↑ (0.02→0.025)
- **Route B:** x0_lr↓ (0.5→0.2), x0_beta1↑ (0.8→0.9+)

Both gave ~0.002 improvement, but combining them caused conflicts. Fine-tuning found wd=0.13, matrix_lr=0.027, emb_lr=0.38 helped slightly. Best d12 config: Route A + x0_beta1=0.95.

**At d16**, Route B became competitive with Route A. The routes still conflicted when combined.

**At d20** (target scale), everything changed:
- Fine-tuned values from d12 **actively hurt** performance
- Routes no longer conflicted
- Just `x0_beta1=0.96` alone captured nearly all the gains

### Final x0_beta1 Sweep at d20

| x0_beta1 | val/bpb | Δ vs baseline |
|----------|---------|---------------|
| **0.96** | **0.7971** | **-0.0007** |
| 0.94 | 0.7972 | -0.0006 |
| 0.90 | 0.7972 | -0.0006 |
| 0.97 | 0.7977 | -0.0001 |
| 0.98 | 0.8011 | +0.0033 💀 |

Flat plateau from 0.90-0.96, then sharp cliff at 0.97+.

### Key Learnings

1. **Hyperparameters are scale-dependent.** What works at d12 doesn't transfer to d20. The elaborate fine-tuning that won at d12 actively hurts at d20.

2. **Improvement magnitude shrinks with scale.** ~0.002 at d12 → ~0.0007 at d20. The baseline is already better-tuned for larger models.

3. **Sharp cliffs exist.** x0_beta1=0.98 is catastrophic while 0.96 is optimal.

4. **Don't over-tune on small proxies.** Validate at target scale before shipping.

### Final Recommendation

For production d20 runs, add one flag:
```
--x0-lambdas-beta1=0.96
```

Skip everything else discovered at smaller scales.

---

## 2026-01-18: More various experiments

- Tried Muon custom kernels for XXT and all the others. The improvement was there for targeted tests (~20%) but washed out completely to noise in an actual training run, especially because the Muon compute is split across all the workers. Abandoned due to complexity bloat.
- Fuse Q,K,V,O nn.Linear layers into a single QKVO Linear layer. ~Zero impact
- Tried the `sa_lambdas` that gate QKV and O. Slightly confused because of the use of rmsnorm, which erases the effect of any scalar multiplier. Helped a tiny bit (~1e-4 of loss), abandoned to control complexity.

---

## 2026-01-17: Various experiments

Modded-nanogpt uses [Value Embeddings](https://arxiv.org/abs/2410.17897) (VEs) in a funny U-shaped structure, 3 of them in total and with gates. I tried a large number of tweaks on this today:

- VEs at every layer, at alternating layers, U shaped, front and back. Alternating layers worked best, i.e. we end up with *a lot* more VEs than modded-nanogpt, at every other layer. It works better.
- Many parameters sharing ideas to reduce new parameter count, nothing here worked. All failed.
- Many ideas to reduce parameter count, the LLM hates all of them: low rank decompositions, projections. All failed.
- Gated yes or no and how much. Gate helps.

Long story short is that the models *love* Value Embeddings. It is a way to add a huge amount of capacity (parameters) to the model at almost zero cost of FLOPs, because these embeddings are simply added to the Values tensor. Any attempt to reduce the capacity of value embeddings (param sharing, low rank, projections) fail. The model wants many of them, and with all the capacity, and doing so wins across all x axes of steps, flops and wall clock. I re-ran the scaling laws and, because the models are now very parameter bloated, the optimal ratio has halved from 8 to 4! Way down lower than Chinchilla's 20 at this point.

Other experiments, looking at val/bpb as a function of all of steps, flops and wall clock time:

- Aspect ratio of 128 is worse than 64, I tried a sweep fixing FLOPs == 1e18 and 64 outperforms. The LLM prefers to be slightly thinner and longer.
- Head dim definitely prefers to be 128 instead of 64, i.e. fewer bigger heads
- Bunch of other random stuff like that.

Keeping all of this work on a private branch for now but hope to push shortly.

---

## 2026-01-17: Modded-nanogpt Ideas Sweep (Continued)

Continued testing ideas from modded-nanogpt.

| Idea | Result | Notes |
|------|--------|-------|
| Attention gates | No improvement | Per-head learnable gates on attention output. +1GB memory, decreased efficiency. |
| Batch size schedule | Abandoned | 8→16→24 with LR scaling. Made training script too bloated/complex, not worth cognitive overhead. |
| Value embeddings | Helps a lot | Experiments still ongoing, more on this later. |

---

## 2026-01-16: Flash Attention 3 Fallback to SDPA

Added automatic fallback from Flash Attention 3 to PyTorch's `scaled_dot_product_attention` (SDPA) for users without Hopper GPUs. This enables nanochat to run on older CUDA GPUs, CPU, and MPS (Apple Silicon).

### Implementation

Created `nanochat/flash_attention.py` - a unified interface that:
- Detects FA3 availability at import time (requires sm90+ / Hopper)
- Exports a `flash_attn` object matching FA3's API exactly (`flash_attn.flash_attn_func`, `flash_attn.flash_attn_with_kvcache`)
- Automatically routes to FA3 or SDPA based on hardware
- Handles tensor layout differences: FA3 uses (B, T, H, D), SDPA uses (B, H, T, D)
- Implements sliding window attention via explicit masks for SDPA
- Manages KV cache manually for SDPA (FA3 does it in-place)

### Changes to Existing Files

Changes to existing code were intentionally kept extremely minimal.

**gpt.py**: Only the import line changed and a comment

**engine.py**: Zero changes needed

**base_train.py**: Added status print and warnings:
- Prints whether FA3 or SDPA fallback is being used
- Warns about efficiency loss without FA3
- Warns about sliding window support if `--window-pattern` is not "L"

### Testing

Tests are split into two classes due to dtype/device constraints:

1. **TestFA3VsSDPA**: Comparison tests requiring Hopper GPU + bfloat16. Run both implementations on identical inputs and verify outputs match (max diff typically 0, at most ~0.004 for sliding window).

2. **TestSDPAOnly**: SDPA-only tests that run on any device with appropriate dtype. Verify forward pass, backward pass, and KV cache work correctly.

Added `_override_impl` mechanism for testing - can force 'fa3' or 'sdpa' to directly compare implementations.

### Notes

- SDPA fallback is significantly slower than FA3 especially in that it lacks the sliding window attention support
- Recommend `--window-pattern L` (full context) when using SDPA fallback

---

## 2026-01-16: Modded-nanogpt Ideas Sweep (Mostly Negative)

Tested several architectural ideas from modded-nanogpt to see if they transfer to nanochat. All of these did not help:

| Idea | Result | Notes |
|------|--------|-------|
| Half-truncated RoPE | No improvement | Only first half of head dims get RoPE (base 1024, linspace). Second half "stationary". |
| Asymmetric softcap | Slightly worse | `23 * sigmoid((x+5)/7.5)` vs our symmetric `15 * tanh(x/15)`. May only help with FP8. |
| Smear gate | Negligible | Blend each token with predecessor via learned gate. Tiny improvement not worth n_embd² params. |
| Backout | No improvement | Save activations at ~60% through network, subtract scaled version at end. |
| Skip connection | Slightly worse | Save at layer ~25%, add at layer ~50%. Also +2GB memory from storing activations. |

Value Embeddings do show promise. I need a more elaborate exploration of a few related ideas, which I leave for tomorrow.

---

## 2026-01-15: Olmo pretraining mix (Negative result)

I attempted to train on the Olmo 3 pretraining dataset [allenai/dolma3_mix-6T](https://huggingface.co/datasets/allenai/dolma3_mix-6T) instead of FineWeb-edu. I ran into a number of [errors and issues](https://huggingface.co/datasets/allenai/dolma3_mix-6T/discussions/2) trying to both download and process the dataset and then noticed some quality issues (e.g. some documents seem to be extremely short, like "5".). I managed to work around these with some sensible hacks (e.g. reject documents less than 100 characters in length) and tried to process the dataset exactly as FineWeb, re-trained the tokenizer and trained a d16 model. The CORE score decreased from 15.5 to 13.8, i.e. the result is quite a bit worse.

I am still looking to try the [DCLM dataset](https://arxiv.org/abs/2406.11794), which according to the paper should be better that FineWeb-edu. I do have some concerns that the same group both prepared the DCLM dataset *and* introduced the CORE score so I'm a bit hesitant in case there was some overfitting to CORE score adjacent data distribution.

Classifying as negative result and reverting back to FineWeb-edu for now.

---

## 2026-01-13: Varlen Attention (Negative Result)

Attempted to prevent attention from "leaking" across document boundaries using Flash Attention's `flash_attn_varlen_func`, similar to modded-nanogpt's approach.

### Background

With the BOS-aligned dataloader, multiple documents are packed into each row. Standard attention allows tokens to attend across document boundaries within a row. The hypothesis was that preventing this "leakage" via varlen attention might improve training.

### Approach: Compute cu_seqlens from inputs

- Find BOS positions: `(inputs.view(-1) == bos_token_id).nonzero()`
- Gotcha 1: Variable-length `cu_seqlens` caused torch.compile recompilation (25s/iter!) - fixed by padding to fixed size
- Gotcha 2: `nonzero()` inside compiled model hit recompile limit - fixed by moving computation outside compiled region

### Final Results (d16)

| Metric | Baseline | Varlen |
|--------|----------|--------|
| val_bpb | 0.85427 | 0.85407 |
| MFU | ~same | ~same |
| tok/sec | ~same | ~same |

Essentially identical. The 0.0002 bpb improvement is almost noise.

### Conclusion

Not worth the code complexity. The "leakage" across document boundaries within a row is not harmful - the model handles it fine. The BOS-aligned dataloader already provides the key benefit (every row starts with proper context). Not merging to master.

---

## 2026-01-13: BOS-Aligned Dataloader with Bin Packing

Redesigned the pretraining and midtraining dataloader to ensure every sequence starts with a BOS token, and explored bin-packing algorithms to minimize wasted tokens.

### Problem Statement

The original dataloader streams tokens into a flat buffer and reshapes into batches. This means some rows start mid-document (no BOS), which could confuse the model during training. We want every row to start with BOS and contain well-formed documents.

### Approach 1: Greedy-Crop BOS (Simple)

Each row is built independently:
- Start with a document (which has BOS prepended)
- Pack more documents until row is full
- If a document doesn't fit, **crop it** to fill remaining space (discard the rest)
- 100% utilization (no padding), but wastes cropped tokens

### Waste Analysis

Measured token waste empirically on real data (T=2048):
- **39.4% of tokens are cropped** (discarded when docs don't fit)
- **22.9% is the theoretical minimum** (tokens in docs longer than T+1 that can never fit)
- The extra ~16.5% comes from "unlucky" cropping when a long doc starts near the end of a row

### Bin Packing Algorithms Explored

| Algorithm | Util% | Crop% | Pad% | Notes |
|-----------|-------|-------|------|-------|
| Greedy-Crop (baseline) | 100% | 39.4% | 0% | Simple, no wasted compute |
| Greedy-Pad | 78% | 23.0% | 22% | Pads instead of crops - wastes compute |
| First-Fit Decreasing (FFD) | 99.7% | 23.0% | 0.3% | Near-optimal packing, minimal padding |
| **BestFit-Crop** | 100% | 34.6% | 0% | Smart cropping, no padding |

### BestFit-Crop Algorithm

A middle ground that maintains 100% utilization while reducing cropping:

1. Buffer N documents
2. For each row, greedily pick the **largest doc that fits entirely**
3. Repeat until nothing fits
4. When nothing fits, crop a doc to fill remaining space exactly

This avoids "unlucky" crops by searching the buffer for better-fitting documents.

**Results (T=2048):**
- Crop waste reduced from 39.4% → 34.6% (~12% relative improvement)
- Still achieves 100% utilization (no padding, every token trains)
- Slightly more rows than baseline (uses more documents per batch)

### Decision: Keep Two Implementations

1. Keep the original implementation which is very simple, efficient and has 100% token utilization in the batch (no padding with ignore tokens), but creates slightly more confusing token streams for the LLM because documents during training can start abruptly from the middle with no context. Note that this never happens at test time, where BOS is always present.

2. **`_bos_bestfit` (BestFit-Crop, new default)**: Slightly more complex but still keeps 100% token utilization in the batch (no padding), but at the cost of discarding documents when they don't fit. In practice, about 34% of tokens are discarded with this approach. This is ok because for most models we care about we have plenty of data without having to go to multiple epochs. One more subtle effect is that it does skew the data distribution a tiny bit because, reliably and necessarily, tokens at the tails of long documents will be discarded. However, this doesn't seem to impact actual downstream performance.

### Midtraining

The midtraining dataloader was also updated. Because conversations are on average a lot shorter than pretraining documents, only about 3.3% of tokens get cropped.

### NOTE: loss scale

Do note that switching to the BOS dataloader changes the validation loss and makes all previous experiments not comparable in absolute value of the loss, because we have a lot fewer "confusing" tokens in the train/val batches. All tokens can look back and find the BOS token and have the full context of that document to make predictions. Therefore, the loss appears lower but this is "fake" to some extent, and the expectation is that the vast majority of relative comparisons done so far would agree with those before and after this change.

---

## 2026-01-13: Number Token Split Pattern

Validated the `\p{N}{1,2}` pattern in `SPLIT_PATTERN` (tokenizer.py line 30), which I only guessed earlier and had a TODO for to validate. GPT-4 uses `\p{N}{1,3}` to group number sequences of up to 3 digits into tokens, but we suspected smaller vocab sizes benefit from grouping fewer digits per token.

**Results (d12, vocab=32K):**
| Pattern | val_bpb |
|---------|---------|
| `\p{N}{1,1}` | 0.969 |
| `\p{N}{1,2}` | **0.965** |
| `\p{N}{1,3}` | 0.972 |

**Conclusion:** `{1,2}` is optimal for vocab size 32K. Grouping 3 digits wastes tokens on rare 3-digit combinations; grouping 1 digit is too fine-grained and bloats token sequences. Keeping `{1,2}` as default.

---

## 2026-01-13: FP8 Training for lm_head

Attempted to use FP8 (8-bit floating point) for the lm_head layer to speed up the large vocab projection matmul. H100 GPUs have FP8 tensor cores that can theoretically provide ~2x speedup over BF16.

### Implementation Approaches Tried

**1. Dynamic Scaling (failed)**
- Compute `x.abs().max()` and `w.abs().max()` each forward to determine scales
- Problem: `.item()` calls cause graph breaks with torch.compile
- Tried `@torch._dynamo.allow_in_graph` pattern (like torchao.float8) - worked but no speedup
- Tried `torch.library.custom_op` with float scales - caused NaN gradients after first optimizer step
- Root cause: interaction between custom ops, dynamic scale computation, and torch.compile is fragile

**2. Static Scaling (partial success)**
- Pre-set scales at init time like modded-nanogpt: `x_scale=10/448, w_scale=0.1/448`
- `grad_scale` computed dynamically from batch size (safe since it's just `1/(B*T)/57344` due to the gradient expression of cross entropy). modded-nanogpt has a bug here probably because they set `grad_scale = 0.75/448`, but grads are in E5M2 so this should probably be `1/57344`, 1 being the amax of any individual element of cross entropy loss, and no normalization by B,T because they use sum reduction not mean reduction.
- Uses `torch.library.custom_op` with `@torch.compile` on inner kernels
- This works correctly - no NaNs, proper gradients

### Results (d12)

| Metric | BF16 Baseline | FP8 lm_head |
|--------|---------------|-------------|
| GPU Memory | 34 GB | 36 GB |
| tok/sec | baseline | ~1% faster |

### The Memory Mystery

FP8 *should* save memory since we store `x_f8` (1 byte) instead of `x` (2 bytes) for backward. But we see 2GB *increase*. Suspected causes:
- `torch.compile` on inner kernels creating extra buffers/specializations
- `torch._scaled_mm` internal workspace allocations
- Custom op registration machinery overhead

Tried saving original weight `w` (just a reference to parameter) instead of `w_f8` in backward, then re-quantizing on the spot during backward - didn't help. Still saw bump.

### Microbenchmark vs Reality

Raw microbenchmark showed promise:
- BF16 matmul: 16.95 ms
- FP8 matmul (static scales): 10.31 ms (1.64x faster)
- FP8 with dynamic scaling: 12.25 ms (1.38x faster)

But in full training, the ~1% tok/sec improvement doesn't justify the 2GB memory increase and the added code complexity and the need to tune scale factors for both x and w.

### Code Artifacts

See the branch `fp8_attempt_fail` for:

- `nanochat/fp8_static.py` - Static scaling implementation (working)
- `nanochat/fp8_dynamic.py` - Dynamic scaling implementation (torchao-style, working but slow)
- `gpt.py` imports `fp8_static.LinearFP8` and simply swaps it for `lm_head` in `gpt.py`.

### Open Questions

- Why does the custom op approach use more memory than vanilla BF16?
- Why is the bump in tok_per_sec so low? We should see ~1.6X speedup in both the forward pass and also (twice) in backward pass for the gradients. Granted, Amdahl's law is part of the solution because our vocab_size is only 32K so the final layer isn't a huge part of the profile but the expected speedup is still not fully realized.

**Conclusion:** Negative result for now. The implementation works correctly but provides marginal speedup with *increased* memory usage. I'm not understanding the torch.compile interaction here. The complexity of FP8 custom ops isn't justified for lm_head alone. TODO to study in more detail the way this is implemented in other libraries, e.g. torchao.

---

## 2026-01-12: Multi-Token Prediction (MTP)

Ported multi-token prediction from modded-nanogpt. Instead of predicting just the next token, predict the next n tokens at each position with weighted loss.

### Implementation

- Instead of calling the loss `n_predict` times, uses a fancy batched computation using `unfold` + `gather` + cross-entropy decomposition (`CE = logsumexp - logits[target]`)
- Schedule anneals from 3-token to 1-token prediction:
  - 0-33%: `[1.0, 0.5, 0.25→0]` (3rd token fades)
  - 33-67%: `[1.0, 0.5→0]` (2nd token fades)
  - 67-100%: `[1.0]` (standard next-token)
- Weights normalized to sum to 1

### Results (d12)

| Metric | Baseline | MTP |
|--------|----------|-----|
| GPU Memory | 34 GB | 47 GB |
| MFU | 41% | 40% |
| val/bpb (per step) | baseline | same/slightly worse |
| val/bpb (wall clock) | baseline | noticeably worse |

**Conclusion:** Negative result for nanochat. The extra memory and compute overhead from predicting multiple tokens doesn't pay off, in fact the results get worse. The auxiliary loss signal may help in other settings (larger models, different architectures?), but for our setup it's pure overhead at the moment.

---

## 2026-01-11: Sliding Window Attention

Added configurable sliding window attention, inspired by GPT-3's alternating short/long pattern.

**Pattern string configuration:**
- New `--window_pattern` CLI arg and `GPTConfig.window_pattern` field
- Pattern is tiled across layers (e.g., `SSSL` for 20 layers → `SSSLSSSLSSSLSSSLSSSL`)
- Final layer always forced to L (full context) regardless of pattern
- Short window = `sequence_len // 2`
- Long window = `sequence_len` (full context)
- All previous models so far have been simply `L` and checkpoint loading is modified accordingly to fill in this param for old models, see `_patch_missing_config_keys`

Quick experiments showed `SSSL` (every 4th layer is long) works well - provides a good balance between compute savings and model quality. This is now the default.

---

## 2026-01-11: Flash Attention 3 Integration

Replaced PyTorch's `scaled_dot_product_attention` (FA2) with Flash Attention 3 for training and inference.

### Changes Made

**1. FA3 via `kernels` package**
- Official FA3 is "beta" and requires building from source (painful)
- Using `kernels` package from HuggingFace Hub: `get_kernel('varunneal/flash-attention-3')`
- Loads pre-built wheels, works out of the box on H100

**2. Simplified attention code**
- FA3 uses `(B, T, H, D)` layout matching our projection output directly - no transpose needed
- Training: `flash_attn.flash_attn_func(q, k, v, causal=True)`
- Inference: `flash_attn.flash_attn_with_kvcache()` handles all cache cases in one call
- Removed 3 separate FA2 code paths (training, single-token, chunk inference)
- GQA handled automatically when n_kv_heads < n_heads

**3. Rewrote KVCache for FA3**
- Old format: `(num_layers, 2, B, H, T, D)` combined tensor
- New format: separate `k_cache` and `v_cache` of shape `(num_layers, B, T, H, D)`
- FA3 updates cache in-place during `flash_attn_with_kvcache`
- Position tracked via `cache_seqlens` tensor (int32, per batch element)
- Simpler API: `get_layer_cache()`, `advance()`, `reset()`, `prefill()`

### Results

- **~9% improvement in tok/sec** during training out of the box
- Benchmarks showed FA3 is 2x faster than FA2 at realistic training sizes (batch=32, seq=2048)
- FA3 supports sliding window via `window_size=(left, 0)`, which is huge and expected to give further improvements. This is ready to tune but keeping full context for now.

---

## 2026-01-11: Per-Layer Residual Scalars (x0 & resid lambdas)

Cherry-picked an idea from modded-nanogpt around learnable per-layer residual connections.

### Changes Made

**1. x0_lambdas (x0 residual connections)**
- Save initial normalized embedding as `x0` after `norm(wte(idx))`
- At each layer, blend x0 back in: `x = resid_lambdas[i] * x + x0_lambdas[i] * x0`
- Zero-initialized, so disabled at start; model learns which layers benefit from the shortcut
- Provides direct path from embedding to deep layers, helps preserve token information

**2. resid_lambdas (residual stream scaling)**
- Per-layer multiplicative scaling of the residual stream
- Initialized to 1.0 (neutral, standard transformer behavior)
- Allows model to learn to amplify/dampen residual at each layer

**3. DistAdamW small parameter handling**
- Added support for parameters with < 1024 elements (like the scalar lambdas)
- Small params use `all_reduce` instead of `reduce_scatter`/`all_gather`
- Fixes crash when param shape isn't divisible by world_size

### Key Finding: Different LR Sensitivity

The two scalar types need very different learning rates:
- **x0_lambdas (additive)**: Can use normal LR (~0.5). Adding a fraction of x0 is forgiving.
- **resid_lambdas (multiplicative)**: Needs ~100x smaller LR (~0.005). Multiplying the residual compounds through layers.

Implementation: `resid_params` gets `scalar_lr * 0.01`, `x0_params` gets full `scalar_lr`.

### Experiment Results

Swept `--scalar_lr` (controlling x0_lambdas) at multiple depths:

| Depth | Baseline (disabled) | Best scalar_lr | Best val_bpb | Δ bpb |
|-------|---------------------|----------------|--------------|-------|
| d8    | 1.0885              | 0.20           | 1.0782       | -0.0103 |
| d12   | 0.9770              | 0.60           | 0.9693       | -0.0077 |
| d16   | 0.9059              | 0.20           | 0.9002       | -0.0057 |
| d20   | 0.8565              | 0.10           | 0.8526       | -0.0039 |

**Observations:**
- Consistent improvement across all model sizes
- Optimal LR varies by depth; default of 0.5 is reasonable, but 0.6 is better for d12
- Adding resid_lambdas (with 0.01x LR) gives small additional improvement over x0 alone

### Meta Device Footgun

Important lesson: `__init__` runs in meta device context, so any tensor values set there are fake. Must initialize actual values in `init_weights()`. Added docstring warning to `__init__`.

### Summary

Added `--scalar_lr` (default 0.5) controlling learnable per-layer scalars. The formula `x = resid_lambdas[i] * x + x0_lambdas[i] * x0` gives the model control over residual scaling and direct shortcuts to the initial embedding. Solid improvement with essentially no compute overhead.

---

## 2026-01-10: Muon Optimizer Upgrades & Cautious Weight Decay

Cherry-picked improvements from NorMuon (modded-nanogpt) into our simpler Muon implementation. Decided against using NorMuon directly due to hard-coded architecture assumptions (expects 32 params split 10 attn + 22 mlp), parameter labeling requirements, and complexity.

### Changes Made

**1. Polar Express Orthogonalization**
- Replaced Newton-Schulz iteration with "Polar Express Sign Method" from [arxiv.org/pdf/2505.16932](https://arxiv.org/pdf/2505.16932)
- Uses 5 different coefficient tuples (one per iteration) instead of fixed coefficients
- Both methods kept in code for easy comparison (`zeropower_via_polar_express` vs `zeropower_via_newtonschulz5`)
- **Result:** No dramatic/noticeable difference in training, but keeping the new Polar Express as default.

**2. NorMuon Variance Reduction**
- Added per-neuron/column adaptive learning rate from NorMuon ([arxiv.org/pdf/2510.05491](https://arxiv.org/pdf/2510.05491))
- Maintains `second_momentum_buffer` with shape `[rows, 1]` or `[1, cols]` (whichever is smaller)
- Normalizes updates based on running per-row/col variance estimate (beta2=0.95)
- Memory overhead: ~1/max(rows, cols) per param, negligible
- **Result:** Led to a very small improvement, kept and enabled by default.

**3. Cautious Weight Decay**
- Only decays weights where `update * weight >= 0` (same sign) from [arxiv.org/abs/2411.16085](https://arxiv.org/abs/2411.16085)
- Standard WD always pulls toward zero; cautious WD skips decay when gradient is pushing weight away from zero
- **Implementation note:** Had to inline the logic rather than use a separate `@torch.compile` function. Passing changing float values (like `weight_decay` during scheduling) as function arguments triggers recompilation. Reading from `group["weight_decay"]` inside the step avoids this.
- **Result:** Solid improvements, especially the cautious version was better than standard wd.
- Now defaults to ON for Muon via the `weight_decay` param. AdamW still has no weight decay and is hardcoded to 0 weight decay, might try to re-tune this later.

**4. Weight decay schedule**
- Added a linear schedule to weight decay that is default on from 1.0 to 0.0 (i.e. start with max weight decay in the beginning of training, then ramp to 0 by the end). Worked better than a static setting in experiments. (modded-nanogpt has the same schedule but it is implemented in a more confusing way by multiplying twice by the learning rate, which is already wired up to a decay schedule).

### Weight Decay Scaling Experiments

Swept weight decay values at d8, d12, d16, d20 to find optimal values and scaling law.

**Optimal Values Found:**
| Depth | Width (channels) | Optimal WD |
|-------|------------------|------------|
| d8    | 512              | ~0.40      |
| d12   | 768              | ~0.22      |
| d16   | 1024             | ~0.10      |
| d20   | 1280             | ~0.08      |

**Scaling Law:**
- Fit power law: `WD = k / channels^α` in log-log space
- Found α ≈ 1.97 (approximately 2), meaning WD ∝ 1/width²

**Practical Formula:**
```
WD_target = WD_reference × (d_reference / d_target)²
```
Example: If d12 optimal is 0.22, then d20 optimal ≈ 0.22 × (12/20)² ≈ 0.08

**Reference:** Moonlight paper uses fixed WD=0.1 for their 15B MoE model. Our experiments indicated a scaling law where the optimal WD changed with depth, so we go along with the empirical scaling law.

### Summary

Muon was changed to use Polar Express, added NorMuon variance reduction, and cautious weight decay with schedule that ramps linearly to zero. All of these changes follow modded-nanogpt repo, but all of them were also validated piece by piece to yield improvements in nanochat with the exception of the Polar Express change which was in the noise. This is default on and configurable with `--weight_decay`, using simply 0.2 and ∝ 1/width² scaling. The kwarg `--weight_decay` is therefore changing as of this change. It used to configure AdamW via standard weight decay and now it becomes exclusively used in Muon (AdamW is hardcoded to 0.0), and it is scaled based on depth.

---

## 2026-01-08: exp_grad_clip - Gradient Clipping

**Hypothesis:** Gradient clipping may be unnecessary overhead. Tested L2 norm clipping at various thresholds (0.25, 0.5, 1.0, 2.0) and elementwise clipping.

**Results:**
- No benefit at any scale tested (d12, d20)
- All variants within noise (~0.9827 val_bpb)
- Grad norm never exceeds 1.0 naturally, so clipping is always inactive
- Clipping adds ~2% time overhead from the all-reduce

**Bug Found:** Original implementation clipped local gradients before sync. Since this codebase doesn't use DDP (gradient sync is in the optimizers), each rank was clipping based on its own local norm. Fixed on the branch with proper distributed all-reduce.

**Observation:** modded-nanogpt does not appear to clip either right now.

**Summary:** Deleted all grad-clip code paths. The code naturally produces well-behaved gradients. This improves a bit of MFU because we don't have to calculate and sync grad norms.
```

### Important image/diagram links

- `README.md` → https://raw.githubusercontent.com/karpathy/nanochat/master/dev/nanochat.png
- `README.md` → https://raw.githubusercontent.com/karpathy/nanochat/master/dev/scaling_laws_jan26.png
- `README.md` → https://github.com/user-attachments/assets/ed39ddf8-2370-437a-bedc-0f39781e76b5

## karpathy/autoresearch (branch: `master`)

### `README.md`

```markdown
# autoresearch

![teaser](progress.png)

*One day, frontier AI research used to be done by meat computers in between eating, sleeping, having other fun, and synchronizing once in a while using sound wave interconnect in the ritual of "group meeting". That era is long gone. Research is now entirely the domain of autonomous swarms of AI agents running across compute cluster megastructures in the skies. The agents claim that we are now in the 10,205th generation of the code base, in any case no one could tell if that's right or wrong as the "code" is now a self-modifying binary that has grown beyond human comprehension. This repo is the story of how it all began. -@karpathy, March 2026*.

The idea: give an AI agent a small but real LLM training setup and let it experiment autonomously overnight. It modifies the code, trains for 5 minutes, checks if the result improved, keeps or discards, and repeats. You wake up in the morning to a log of experiments and (hopefully) a better model. The training code here is a simplified single-GPU implementation of [nanochat](https://github.com/karpathy/nanochat). The core idea is that you're not touching any of the Python files like you normally would as a researcher. Instead, you are programming the `program.md` Markdown files that provide context to the AI agents and set up your autonomous research org. The default `program.md` in this repo is intentionally kept as a bare bones baseline, though it's obvious how one would iterate on it over time to find the "research org code" that achieves the fastest research progress, how you'd add more agents to the mix, etc. A bit more context on this project is here in this [tweet](https://x.com/karpathy/status/2029701092347630069) and [this tweet](https://x.com/karpathy/status/2031135152349524125).

## How it works

The repo is deliberately kept small and only really has three files that matter:

- **`prepare.py`** — fixed constants, one-time data prep (downloads training data, trains a BPE tokenizer), and runtime utilities (dataloader, evaluation). Not modified.
- **`train.py`** — the single file the agent edits. Contains the full GPT model, optimizer (Muon + AdamW), and training loop. Everything is fair game: architecture, hyperparameters, optimizer, batch size, etc. **This file is edited and iterated on by the agent**.
- **`program.md`** — baseline instructions for one agent. Point your agent here and let it go. **This file is edited and iterated on by the human**.

By design, training runs for a **fixed 5-minute time budget** (wall clock, excluding startup/compilation), regardless of the details of your compute. The metric is **val_bpb** (validation bits per byte) — lower is better, and vocab-size-independent so architectural changes are fairly compared.

If you are new to neural networks, this ["Dummy's Guide"](https://x.com/hooeem/status/2030720614752039185) looks pretty good for a lot more context.

## Quick start

**Requirements:** A single NVIDIA GPU (tested on H100), Python 3.10+, [uv](https://docs.astral.sh/uv/).

```bash

# 1. Install uv project manager (if you don't already have it)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Install dependencies
uv sync

# 3. Download data and train tokenizer (one-time, ~2 min)
uv run prepare.py

# 4. Manually run a single training experiment (~5 min)
uv run train.py
```

If the above commands all work ok, your setup is working and you can go into autonomous research mode.

## Running the agent

Simply spin up your Claude/Codex or whatever you want in this repo (and disable all permissions), then you can prompt something like:

```
Hi have a look at program.md and let's kick off a new experiment! let's do the setup first.
```

The `program.md` file is essentially a super lightweight "skill".

## Project structure

```
prepare.py      — constants, data prep + runtime utilities (do not modify)
train.py        — model, optimizer, training loop (agent modifies this)
program.md      — agent instructions
pyproject.toml  — dependencies
```

## Design choices

- **Single file to modify.** The agent only touches `train.py`. This keeps the scope manageable and diffs reviewable.
- **Fixed time budget.** Training always runs for exactly 5 minutes, regardless of your specific platform. This means you can expect approx 12 experiments/hour and approx 100 experiments while you sleep. There are two upsides of this design decision. First, this makes experiments directly comparable regardless of what the agent changes (model size, batch size, architecture, etc). Second, this means that autoresearch will find the most optimal model for your platform in that time budget. The downside is that your runs (and results) become not comparable to other people running on other compute platforms.
- **Self-contained.** No external dependencies beyond PyTorch and a few small packages. No distributed training, no complex configs. One GPU, one file, one metric.

## Platform support

This code currently requires that you have a single NVIDIA GPU. In principle it is quite possible to support CPU, MPS and other platforms but this would also bloat the code. I'm not 100% sure that I want to take this on personally right now. People can reference (or have their agents reference) the full/parent nanochat repository that has wider platform support and shows the various solutions (e.g. a Flash Attention 3 kernels fallback implementation, generic device support, autodetection, etc.), feel free to create forks or discussions for other platforms and I'm happy to link to them here in the README in some new notable forks section or etc.

Seeing as there seems to be a lot of interest in tinkering with autoresearch on much smaller compute platforms than an H100, a few extra words. If you're going to try running autoresearch on smaller computers (Macbooks etc.), I'd recommend one of the forks below. On top of this, here are some recommendations for how to tune the defaults for much smaller models for aspiring forks:

1. To get half-decent results I'd use a dataset with a lot less entropy, e.g. this [TinyStories dataset](https://huggingface.co/datasets/karpathy/tinystories-gpt4-clean). These are GPT-4 generated short stories. Because the data is a lot narrower in scope, you will see reasonable results with a lot smaller models (if you try to sample from them after training).
2. You might experiment with decreasing `vocab_size`, e.g. from 8192 down to 4096, 2048, 1024, or even - simply byte-level tokenizer with 256 possibly bytes after utf-8 encoding.
3. In `prepare.py`, you'll want to lower `MAX_SEQ_LEN` a lot, depending on the computer even down to 256 etc. As you lower `MAX_SEQ_LEN`, you may want to experiment with increasing `DEVICE_BATCH_SIZE` in `train.py` slightly to compensate. The number of tokens per fwd/bwd pass is the product of these two.
4. Also in `prepare.py`, you'll want to decrease `EVAL_TOKENS` so that your validation loss is evaluated on a lot less data.
5. In `train.py`, the primary single knob that controls model complexity is the `DEPTH` (default 8, here). A lot of variables are just functions of this, so e.g. lower it down to e.g. 4.
6. You'll want to most likely use `WINDOW_PATTERN` of just "L", because "SSSL" uses alternating banded attention pattern that may be very inefficient for you. Try it.
7. You'll want to lower `TOTAL_BATCH_SIZE` a lot, but keep it powers of 2, e.g. down to `2**14` (~16K) or so even, hard to tell.

I think these would be the reasonable hyperparameters to play with. Ask your favorite coding agent for help and copy paste them this guide, as well as the full source code.

## Notable forks

- [miolini/autoresearch-macos](https://github.com/miolini/autoresearch-macos) (MacOS)
- [trevin-creator/autoresearch-mlx](https://github.com/trevin-creator/autoresearch-mlx) (MacOS)
- [jsegov/autoresearch-win-rtx](https://github.com/jsegov/autoresearch-win-rtx) (Windows)
- [andyluo7/autoresearch](https://github.com/andyluo7/autoresearch) (AMD)

## License

MIT
```

### `program.md`

```markdown
# autoresearch

This is an experiment to have the LLM do its own research.

## Setup

To set up a new experiment, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar5`). The branch `autoresearch/<tag>` must not already exist — this is a fresh run.
2. **Create the branch**: `git checkout -b autoresearch/<tag>` from current master.
3. **Read the in-scope files**: The repo is small. Read these files for full context:
   - `README.md` — repository context.
   - `prepare.py` — fixed constants, data prep, tokenizer, dataloader, evaluation. Do not modify.
   - `train.py` — the file you modify. Model architecture, optimizer, training loop.
4. **Verify data exists**: Check that `~/.cache/autoresearch/` contains data shards and a tokenizer. If not, tell the human to run `uv run prepare.py`.
5. **Initialize results.tsv**: Create `results.tsv` with just the header row. The baseline will be recorded after the first run.
6. **Confirm and go**: Confirm setup looks good.

Once you get confirmation, kick off the experimentation.

## Experimentation

Each experiment runs on a single GPU. The training script runs for a **fixed time budget of 5 minutes** (wall clock training time, excluding startup/compilation). You launch it simply as: `uv run train.py`.

**What you CAN do:**
- Modify `train.py` — this is the only file you edit. Everything is fair game: model architecture, optimizer, hyperparameters, training loop, batch size, model size, etc.

**What you CANNOT do:**
- Modify `prepare.py`. It is read-only. It contains the fixed evaluation, data loading, tokenizer, and training constants (time budget, sequence length, etc).
- Install new packages or add dependencies. You can only use what's already in `pyproject.toml`.
- Modify the evaluation harness. The `evaluate_bpb` function in `prepare.py` is the ground truth metric.

**The goal is simple: get the lowest val_bpb.** Since the time budget is fixed, you don't need to worry about training time — it's always 5 minutes. Everything is fair game: change the architecture, the optimizer, the hyperparameters, the batch size, the model size. The only constraint is that the code runs without crashing and finishes within the time budget.

**VRAM** is a soft constraint. Some increase is acceptable for meaningful val_bpb gains, but it should not blow up dramatically.

**Simplicity criterion**: All else being equal, simpler is better. A small improvement that adds ugly complexity is not worth it. Conversely, removing something and getting equal or better results is a great outcome — that's a simplification win. When evaluating whether to keep a change, weigh the complexity cost against the improvement magnitude. A 0.001 val_bpb improvement that adds 20 lines of hacky code? Probably not worth it. A 0.001 val_bpb improvement from deleting code? Definitely keep. An improvement of ~0 but much simpler code? Keep.

**The first run**: Your very first run should always be to establish the baseline, so you will run the training script as is.

## Output format

Once the script finishes it prints a summary like this:

```
---
val_bpb:          0.997900
training_seconds: 300.1
total_seconds:    325.9
peak_vram_mb:     45060.2
mfu_percent:      39.80
total_tokens_M:   499.6
num_steps:        953
num_params_M:     50.3
depth:            8
```

Note that the script is configured to always stop after 5 minutes, so depending on the computing platform of this computer the numbers might look different. You can extract the key metric from the log file:

```
grep "^val_bpb:" run.log
```

## Logging results

When an experiment is done, log it to `results.tsv` (tab-separated, NOT comma-separated — commas break in descriptions).

The TSV has a header row and 5 columns:

```
commit	val_bpb	memory_gb	status	description
```

1. git commit hash (short, 7 chars)
2. val_bpb achieved (e.g. 1.234567) — use 0.000000 for crashes
3. peak memory in GB, round to .1f (e.g. 12.3 — divide peak_vram_mb by 1024) — use 0.0 for crashes
4. status: `keep`, `discard`, or `crash`
5. short text description of what this experiment tried

Example:

```
commit	val_bpb	memory_gb	status	description
a1b2c3d	0.997900	44.0	keep	baseline
b2c3d4e	0.993200	44.2	keep	increase LR to 0.04
c3d4e5f	1.005000	44.0	discard	switch to GeLU activation
d4e5f6g	0.000000	0.0	crash	double model width (OOM)
```

## The experiment loop

The experiment runs on a dedicated branch (e.g. `autoresearch/mar5` or `autoresearch/mar5-gpu0`).

LOOP FOREVER:

1. Look at the git state: the current branch/commit we're on
2. Tune `train.py` with an experimental idea by directly hacking the code.
3. git commit
4. Run the experiment: `uv run train.py > run.log 2>&1` (redirect everything — do NOT use tee or let output flood your context)
5. Read out the results: `grep "^val_bpb:\|^peak_vram_mb:" run.log`
6. If the grep output is empty, the run crashed. Run `tail -n 50 run.log` to read the Python stack trace and attempt a fix. If you can't get things to work after more than a few attempts, give up.
7. Record the results in the tsv (NOTE: do not commit the results.tsv file, leave it untracked by git)
8. If val_bpb improved (lower), you "advance" the branch, keeping the git commit
9. If val_bpb is equal or worse, you git reset back to where you started

The idea is that you are a completely autonomous researcher trying things out. If they work, keep. If they don't, discard. And you're advancing the branch so that you can iterate. If you feel like you're getting stuck in some way, you can rewind but you should probably do this very very sparingly (if ever).

**Timeout**: Each experiment should take ~5 minutes total (+ a few seconds for startup and eval overhead). If a run exceeds 10 minutes, kill it and treat it as a failure (discard and revert).

**Crashes**: If a run crashes (OOM, or a bug, or etc.), use your judgment: If it's something dumb and easy to fix (e.g. a typo, a missing import), fix it and re-run. If the idea itself is fundamentally broken, just skip it, log "crash" as the status in the tsv, and move on.

**NEVER STOP**: Once the experiment loop has begun (after the initial setup), do NOT pause to ask the human if you should continue. Do NOT ask "should I keep going?" or "is this a good stopping point?". The human might be asleep, or gone from a computer and expects you to continue working *indefinitely* until you are manually stopped. You are autonomous. If you run out of ideas, think harder — read papers referenced in the code, re-read the in-scope files for new angles, try combining previous near-misses, try more radical architectural changes. The loop runs until the human interrupts you, period.

As an example use case, a user might leave you running while they sleep. If each experiment takes you ~5 minutes then you can run approx 12/hour, for a total of about 100 over the duration of the average human sleep. The user then wakes up to experimental results, all completed by you while they slept!
```

### Important image/diagram links

- `README.md` → https://raw.githubusercontent.com/karpathy/autoresearch/master/progress.png

## karpathy/char-rnn (branch: `master`)

### `Readme.md`

```markdown

# char-rnn

This code implements **multi-layer Recurrent Neural Network** (RNN, LSTM, and GRU) for training/sampling from character-level language models. In other words the model takes one text file as input and trains a Recurrent Neural Network that learns to predict the next character in a sequence. The RNN can then be used to generate text character by character that will look like the original training data. The context of this code base is described in detail in my [blog post](http://karpathy.github.io/2015/05/21/rnn-effectiveness/).

If you are new to Torch/Lua/Neural Nets, it might be helpful to know that this code is really just a slightly more fancy version of this [100-line gist](https://gist.github.com/karpathy/d4dee566867f8291f086) that I wrote in Python/numpy. The code in this repo additionally: allows for multiple layers, uses an LSTM instead of a vanilla RNN, has more supporting code for model checkpointing, and is of course much more efficient since it uses mini-batches and can run on a GPU.

## Update: torch-rnn

[Justin Johnson](http://cs.stanford.edu/people/jcjohns/) (@jcjohnson) recently re-implemented char-rnn from scratch with a much nicer/smaller/cleaner/faster Torch code base. It's under the name [torch-rnn](https://github.com/jcjohnson/torch-rnn). It uses Adam for optimization and hard-codes the RNN/LSTM forward/backward passes for space/time efficiency. This also avoids headaches with cloning models in this repo. In other words, torch-rnn should be the default char-rnn implemention to use now instead of the one in this code base.

## Requirements

This code is written in Lua and requires [Torch](http://torch.ch/). If you're on Ubuntu, installing Torch in your home directory may look something like: 

```bash
$ curl -s https://raw.githubusercontent.com/torch/ezinstall/master/install-deps | bash
$ git clone https://github.com/torch/distro.git ~/torch --recursive
$ cd ~/torch; 
$ ./install.sh      # and enter "yes" at the end to modify your bashrc
$ source ~/.bashrc
```

See the Torch installation documentation for more details. After Torch is installed we need to get a few more packages using [LuaRocks](https://luarocks.org/) (which already came with the Torch install). In particular:

```bash
$ luarocks install nngraph 
$ luarocks install optim
$ luarocks install nn
```

If you'd like to train on an NVIDIA GPU using CUDA (this can be to about 15x faster), you'll of course need the GPU, and you will have to install the [CUDA Toolkit](https://developer.nvidia.com/cuda-toolkit). Then get the `cutorch` and `cunn` packages:

```bash
$ luarocks install cutorch
$ luarocks install cunn
```

If you'd like to use OpenCL GPU instead (e.g. ATI cards), you will instead need to install the `cltorch` and `clnn` packages, and then use the option `-opencl 1` during training ([cltorch issues](https://github.com/hughperkins/cltorch/issues)):

```bash
$ luarocks install cltorch
$ luarocks install clnn
```

## Usage

### Data

All input data is stored inside the `data/` directory. You'll notice that there is an example dataset included in the repo (in folder `data/tinyshakespeare`) which consists of a subset of works of Shakespeare. I'm providing a few more datasets on [this page](http://cs.stanford.edu/people/karpathy/char-rnn/).

**Your own data**: If you'd like to use your own data then create a single file `input.txt` and place it into a folder in the `data/` directory. For example, `data/some_folder/input.txt`. The first time you run the training script it will do some preprocessing and write two more convenience cache files into `data/some_folder`.

**Dataset sizes**: Note that if your data is too small (1MB is already considered very small) the RNN won't learn very effectively. Remember that it has to learn everything completely from scratch. Conversely if your data is large (more than about 2MB), feel confident to increase `rnn_size` and train a bigger model (see details of training below). It will work *significantly better*. For example with 6MB you can easily go up to `rnn_size` 300 or even more. The biggest that fits on my GPU and that I've trained with this code is `rnn_size` 700 with `num_layers` 3 (2 is default).

### Training

Start training the model using `train.lua`. As a sanity check, to run on the included example dataset simply try:

```
$ th train.lua -gpuid -1
```

Notice that here we are setting the flag `gpuid` to -1, which tells the code to train using CPU, otherwise it defaults to GPU 0.  There are many other flags for various options. Consult `$ th train.lua -help` for comprehensive settings. Here's another example that trains a bigger network and also shows how you can run on your own custom dataset (this already assumes that `data/some_folder/input.txt` exists):

```
$ th train.lua -data_dir data/some_folder -rnn_size 512 -num_layers 2 -dropout 0.5
```

**Checkpoints.** While the model is training it will periodically write checkpoint files to the `cv` folder. The frequency with which these checkpoints are written is controlled with number of iterations, as specified with the `eval_val_every` option (e.g. if this is 1 then a checkpoint is written every iteration). The filename of these checkpoints contains a very important number: the **loss**. For example, a checkpoint with filename `lm_lstm_epoch0.95_2.0681.t7` indicates that at this point the model was on epoch 0.95 (i.e. it has almost done one full pass over the training data), and the loss on validation data was 2.0681. This number is very important because the lower it is, the better the checkpoint works. Once you start to generate data (discussed below), you will want to use the model checkpoint that reports the lowest validation loss. Notice that this might not necessarily be the last checkpoint at the end of training (due to possible overfitting).

Another important quantities to be aware of are `batch_size` (call it B), `seq_length` (call it S), and the `train_frac` and `val_frac` settings. The batch size specifies how many streams of data are processed in parallel at one time. The sequence length specifies the length of each stream, which is also the limit at which the gradients can propagate backwards in time. For example, if `seq_length` is 20, then the gradient signal will never backpropagate more than 20 time steps, and the model might not *find* dependencies longer than this length in number of characters. Thus, if you have a very difficult dataset where there are a lot of long-term dependencies you will want to increase this setting. Now, if at runtime your input text file has N characters, these first all get split into chunks of size `BxS`. These chunks then get allocated across three splits: train/val/test according to the `frac` settings. By default `train_frac` is 0.95 and `val_frac` is 0.05, which means that 95% of our data chunks will be trained on and 5% of the chunks will be used to estimate the validation loss (and hence the generalization). If your data is small, it's possible that with the default settings you'll only have very few chunks in total (for example 100). This is bad: In these cases you may want to decrease batch size or sequence length.

Note that you can also initialize parameters from a previously saved checkpoint using `init_from`.

### Sampling

Given a checkpoint file (such as those written to `cv`) we can generate new text. For example:

```
$ th sample.lua cv/some_checkpoint.t7 -gpuid -1
```

Make sure that if your checkpoint was trained with GPU it is also sampled from with GPU, or vice versa. Otherwise the code will (currently) complain. As with the train script, see `$ th sample.lua -help` for full options. One important one is (for example) `-length 10000` which would generate 10,000 characters (default = 2000).

**Temperature**. An important parameter you may want to play with is `-temperature`, which takes a number in range \(0, 1\] (0 not included), default = 1. The temperature is dividing the predicted log probabilities before the Softmax, so lower temperature will cause the model to make more likely, but also more boring and conservative predictions. Higher temperatures cause the model to take more chances and increase diversity of results, but at a cost of more mistakes.

**Priming**. It's also possible to prime the model with some starting text using `-primetext`. This starts out the RNN with some hardcoded characters to *warm* it up with some context before it starts generating text. E.g. a fun primetext might be `-primetext "the meaning of life is "`. 

**Training with GPU but sampling on CPU**. Right now the solution is to use the `convert_gpu_cpu_checkpoint.lua` script to convert your GPU checkpoint to a CPU checkpoint. In near future you will not have to do this explicitly. E.g.:

```
$ th convert_gpu_cpu_checkpoint.lua cv/lm_lstm_epoch30.00_1.3950.t7
```

will create a new file `cv/lm_lstm_epoch30.00_1.3950.t7_cpu.t7` that you can use with the sample script and with `-gpuid -1` for CPU mode.

Happy sampling!

## Tips and Tricks

### Monitoring Validation Loss vs. Training Loss
If you're somewhat new to Machine Learning or Neural Networks it can take a bit of expertise to get good models. The most important quantity to keep track of is the difference between your training loss (printed during training) and the validation loss (printed once in a while when the RNN is run on the validation data (by default every 1000 iterations)). In particular:

- If your training loss is much lower than validation loss then this means the network might be **overfitting**. Solutions to this are to decrease your network size, or to increase dropout. For example you could try dropout of 0.5 and so on.
- If your training/validation loss are about equal then your model is **underfitting**. Increase the size of your model (either number of layers or the raw number of neurons per layer)

### Approximate number of parameters

The two most important parameters that control the model are `rnn_size` and `num_layers`. I would advise that you always use `num_layers` of either 2/3. The `rnn_size` can be adjusted based on how much data you have. The two important quantities to keep track of here are:

- The number of parameters in your model. This is printed when you start training.
- The size of your dataset. 1MB file is approximately 1 million characters.

These two should be about the same order of magnitude. It's a little tricky to tell. Here are some examples:

- I have a 100MB dataset and I'm using the default parameter settings (which currently print 150K parameters). My data size is significantly larger (100 mil >> 0.15 mil), so I expect to heavily underfit. I am thinking I can comfortably afford to make `rnn_size` larger.
- I have a 10MB dataset and running a 10 million parameter model. I'm slightly nervous and I'm carefully monitoring my validation loss. If it's larger than my training loss then I may want to try to increase dropout a bit and see if that heps the validation loss.

### Best models strategy

The winning strategy to obtaining very good models (if you have the compute time) is to always err on making the network larger (as large as you're willing to wait for it to compute) and then try different dropout values (between 0,1). Whatever model has the best validation performance (the loss, written in the checkpoint filename, low is good) is the one you should use in the end.

It is very common in deep learning to run many different models with many different hyperparameter settings, and in the end take whatever checkpoint gave the best validation performance.

By the way, the size of your training and validation splits are also parameters. Make sure you have a decent amount of data in your validation set or otherwise the validation performance will be noisy and not very informative.

## Additional Pointers and Acknowledgements

This code was originally based on Oxford University Machine Learning class [practical 6](https://github.com/oxford-cs-ml-2015/practical6), which is in turn based on [learning to execute](https://github.com/wojciechz/learning_to_execute) code from Wojciech Zaremba. Chunks of it were also developed in collaboration with my labmate [Justin Johnson](http://cs.stanford.edu/people/jcjohns/).

To learn more about RNN language models I recommend looking at:

- [My recent talk](https://skillsmatter.com/skillscasts/6611-visualizing-and-understanding-recurrent-networks) on char-rnn
- [Generating Sequences With Recurrent Neural Networks](http://arxiv.org/abs/1308.0850) by Alex Graves
- [Generating Text with Recurrent Neural Networks](http://www.cs.utoronto.ca/~ilya/pubs/2011/LANG-RNN.pdf) by Ilya Sutskever
- [Tomas Mikolov's Thesis](http://www.fit.vutbr.cz/~imikolov/rnnlm/thesis.pdf)

## License

MIT
```

## karpathy/neuraltalk2 (branch: `master`)

### `README.md`

```markdown

# NeuralTalk2

**Update (September 22, 2016)**: The Google Brain team has [released the image captioning model](https://research.googleblog.com/2016/09/show-and-tell-image-captioning-open.html) of Vinyals et al. (2015). The core model is very similar to NeuralTalk2 (a CNN followed by RNN), but the Google release should work significantly better as a result of better CNN, some tricks, and more careful engineering. Find it under [im2txt](https://github.com/tensorflow/models/tree/master/im2txt/im2txt) repo in tensorflow. I'll leave this code base up for educational purposes and as a Torch implementation.

Recurrent Neural Network captions your images. Now much faster and better than the original [NeuralTalk](https://github.com/karpathy/neuraltalk). Compared to the original NeuralTalk this implementation is **batched, uses Torch, runs on a GPU, and supports CNN finetuning**. All of these together result in quite a large increase in training speed for the Language Model (~100x), but overall not as much because we also have to forward a VGGNet. However, overall very good models can be trained in 2-3 days, and they show a much better performance.

This is an early code release that works great but is slightly hastily released and probably requires some code reading of inline comments (which I tried to be quite good with in general). I will be improving it over time but wanted to push the code out there because I promised it to too many people.

This current code (and the pretrained model) gets ~0.9 CIDEr, which would place it around spot #8 on the [codalab leaderboard](https://competitions.codalab.org/competitions/3221#results). I will submit the actual result soon.

![teaser results](https://raw.github.com/karpathy/neuraltalk2/master/vis/teaser.jpeg)

You can find a few more example results on the [demo page](http://cs.stanford.edu/people/karpathy/neuraltalk2/demo.html). These results will improve a bit more once the last few bells and whistles are in place (e.g. beam search, ensembling, reranking).

There's also a [fun video](https://vimeo.com/146492001) by [@kcimc](https://twitter.com/kcimc), where he runs a neuraltalk2 pretrained model in real time on his laptop during a walk in Amsterdam.

### Requirements


#### For evaluation only

This code is written in Lua and requires [Torch](http://torch.ch/). If you're on Ubuntu, installing Torch in your home directory may look something like: 

```bash
$ curl -s https://raw.githubusercontent.com/torch/ezinstall/master/install-deps | bash
$ git clone https://github.com/torch/distro.git ~/torch --recursive
$ cd ~/torch; 
$ ./install.sh      # and enter "yes" at the end to modify your bashrc
$ source ~/.bashrc
```

See the Torch installation documentation for more details. After Torch is installed we need to get a few more packages using [LuaRocks](https://luarocks.org/) (which already came with the Torch install). In particular:

```bash
$ luarocks install nn
$ luarocks install nngraph 
$ luarocks install image 
```

We're also going to need the [cjson](http://www.kyne.com.au/~mark/software/lua-cjson-manual.html) library so that we can load/save json files. Follow their [download link](http://www.kyne.com.au/~mark/software/lua-cjson.php) and then look under their section 2.4 for easy luarocks install.

If you'd like to run on an NVIDIA GPU using CUDA (which you really, really want to if you're training a model, since we're using a VGGNet), you'll of course need a GPU, and you will have to install the [CUDA Toolkit](https://developer.nvidia.com/cuda-toolkit). Then get the `cutorch` and `cunn` packages:

```bash
$ luarocks install cutorch
$ luarocks install cunn
```

If you'd like to use the cudnn backend (the pretrained checkpoint does), you also have to install [cudnn](https://github.com/soumith/cudnn.torch). First follow the link to [NVIDIA website](https://developer.nvidia.com/cuDNN), register with them and download the cudnn library. Then make sure you adjust your `LD_LIBRARY_PATH` to point to the `lib64` folder that contains the library (e.g. `libcudnn.so.7.0.64`). Then git clone the `cudnn.torch` repo, `cd` inside and do `luarocks make cudnn-scm-1.rockspec` to build the Torch bindings.

#### For training

If you'd like to train your models you will need [loadcaffe](https://github.com/szagoruyko/loadcaffe), since we are using the VGGNet. First, make sure you follow their instructions to install `protobuf` and everything else (e.g. `sudo apt-get install libprotobuf-dev protobuf-compiler`), and then install via luarocks:

```bash
luarocks install loadcaffe
```

Finally, you will also need to install [torch-hdf5](https://github.com/deepmind/torch-hdf5), and [h5py](http://www.h5py.org/), since we will be using hdf5 files to store the preprocessed data.

Phew! Quite a few dependencies, sorry no easy way around it :\

### I just want to caption images

In this case you want to run the evaluation script on a pretrained model checkpoint. 
I trained a decent one on the [MS COCO dataset](http://mscoco.org/) that you can run on your images.
The pretrained checkpoint can be downloaded here: [pretrained checkpoint link](http://cs.stanford.edu/people/karpathy/neuraltalk2/checkpoint_v1.zip) (600MB). It's large because it contains the weights of a finetuned VGGNet. Now place all your images of interest into a folder, e.g. `blah`, and run
the eval script:

```bash
$ th eval.lua -model /path/to/model -image_folder /path/to/image/directory -num_images 10 
```

This tells the `eval` script to run up to 10 images from the given folder. If you have a big GPU you can speed up the evaluation by increasing `batch_size` (default = 1). Use `-num_images -1` to process all images. The eval script will create an `vis.json` file inside the `vis` folder, which can then be visualized with the provided HTML interface:

```bash
$ cd vis
$ python -m SimpleHTTPServer
```

Now visit `localhost:8000` in your browser and you should see your predicted captions.

You can see an [example visualization demo page here](http://cs.stanford.edu/people/karpathy/neuraltalk2/demo.html).

**Running in Docker**. If you'd like to avoid dependency nightmares, running the codebase from Docker might be a good option. There is one (third-party) [docker repo here](https://github.com/beeva-enriqueotero/docker-neuraltalk2).

**"I only have CPU"**. Okay, in that case download the [cpu model checkpoint](http://cs.stanford.edu/people/karpathy/neuraltalk2/checkpoint_v1_cpu.zip). Make sure you run the eval script with `-gpuid -1` to tell the script to run on CPU. On my machine it takes a bit less than 1 second per image to caption in CPU mode.

**Beam Search**. Beam search is enabled by default because it increases the performance of the search for argmax decoding sequence. However, this is a little more expensive, so if you'd like to evaluate images faster, but at a cost of performance, use `-beam_size 1`. For example, in one of my experiments beam size 2 gives CIDEr 0.922, and beam size 1 gives CIDEr 0.886.

**Running on MSCOCO images**. If you train on MSCOCO (see how below), you will have generated preprocessed MSCOCO images, which you can use directly in the eval script. In this case simply leave out the `image_folder` option and the eval script and instead pass in the `input_h5`, `input_json` to your preprocessed files. This will make more sense once you read the section below :)

**Running a live demo**. With OpenCV 3 installed you can caption video stream from camera in real time. Follow the instructions in [torch-opencv](https://github.com/VisionLabs/torch-opencv/wiki/installation) to install it and run `videocaptioning.lua` similar to `eval.lua`. Note that only central crop will be captioned.

### I'd like to train my own network on MS COCO

Great, first we need to some preprocessing. Head over to the `coco/` folder and run the IPython notebook to download the dataset and do some very simple preprocessing. The notebook will combine the train/val data together and create a very simple and small json file that contains a large list of image paths, and raw captions for each image, of the form:

```
[{ "file_path": "path/img.jpg", "captions": ["a caption", "a second caption of i"tgit ...] }, ...]
```

Once we have this, we're ready to invoke the `prepro.py` script, which will read all of this in and create a dataset (an hdf5 file and a json file) ready for consumption in the Lua code. For example, for MS COCO we can run the prepro file as follows:

```bash
$ python prepro.py --input_json coco/coco_raw.json --num_val 5000 --num_test 5000 --images_root coco/images --word_count_threshold 5 --output_json coco/cocotalk.json --output_h5 coco/cocotalk.h5
```

This is telling the script to read in all the data (the images and the captions), allocate 5000 images for val/test splits respectively, and map all words that occur <= 5 times to a special `UNK` token. The resulting `json` and `h5` files are about 30GB and contain everything we want to know about the dataset.

**Warning**: the prepro script will fail with the default MSCOCO data because one of their images is corrupted. See [this issue](https://github.com/karpathy/neuraltalk2/issues/4) for the fix, it involves manually replacing one image in the dataset.

The last thing we need is the [VGG-16 Caffe checkpoint](http://www.robots.ox.ac.uk/~vgg/research/very_deep/), (under Models section, "16-layer model" bullet point). Put the two files (the prototxt configuration file and the proto binary of weights) somewhere (e.g. a `model` directory), and we're ready to train!

```bash
$ th train.lua -input_h5 coco/cocotalk.h5 -input_json coco/cocotalk.json
```

The train script will take over, and start dumping checkpoints into the folder specified by `checkpoint_path` (default = current folder). You also have to point the train script to the VGGNet protos (see the options inside `train.lua`).

If you'd like to evaluate BLEU/METEOR/CIDEr scores during training in addition to validation cross entropy loss, use `-language_eval 1` option, but don't forget to download the [coco-caption code](https://github.com/tylin/coco-caption) into `coco-caption` directory.

**A few notes on training.** To give you an idea, with the default settings one epoch of MS COCO images is about 7500 iterations. 1 epoch of training (with no finetuning - notice this is the default) takes about 1 hour and results in validation loss ~2.7 and CIDEr score of ~0.4. By iteration 70,000 CIDEr climbs up to about 0.6 (validation loss at about 2.5) and then will top out at a bit below 0.7 CIDEr. After that additional improvements are only possible by turning on CNN finetuning. I like to do the training in stages, where I first train with no finetuning, and then restart the train script with `-finetune_cnn_after 0` to start finetuning right away, and using `-start_from` flag to continue from the previous model checkpoint. You'll see your score rise up to about 0.9 CIDEr over ~2 days or so (on MS COCO).

### I'd like to train on my own data

No problem, create a json file in the exact same form as before, describing your JPG files:

```
[{ "file_path": "path/img.jpg", "captions": ["a caption", "a similar caption" ...] }, ...]
```

and invoke the `prepro.py` script to preprocess all the images and data into and hdf5 file and json file. Then invoke `train.lua` (see detailed options inside code).

### I'd like to distribute my GPU trained checkpoints for CPU

Use the script `convert_checkpoint_gpu_to_cpu.lua` to convert your GPU checkpoints to be usable on CPU. See inline documentation for why this separate script is needed. For example:

```bash
th convert_checkpoint_gpu_to_cpu.lua gpu_checkpoint.t7
```

write the file `gpu_checkpoint.t7_cpu.t7`, which you can now run with `-gpuid -1` in the eval script.

### License

BSD License.

### Acknowledgements

Parts of this code were written in collaboration with my labmate [Justin Johnson](http://cs.stanford.edu/people/jcjohns/). 

I'm very grateful for [NVIDIA](https://developer.nvidia.com/deep-learning)'s support in providing GPUs that made this work possible.

I'm also very grateful to the maintainers of Torch for maintaining a wonderful deep learning library.
```

### `cv/README.md`

```markdown

## Cross-validation utilities

### Starting workers on different GPUs

I thought I should do a small code dump of my cross-validation utilities. My workflow is to run on a single machine with multiple GPUs. Each worker runs on one GPU, and I spawn workers with the `spawn.sh` script, e.g.:

```bash
$ ./spawn 0 1 2 3 4 5 6
```

spawns 7 workers using GPUs 0-6 (inclusive), all running in screen sessions `ak0`...`ak6`. E.g. to attach to one of these it would be `screen -r ak0`. And `CTRL+a, d` to detach from a screen session and `CTRL+a, k, y` to kill a worker. Also `./killall.sh` to kill all workers.

You can see that `spawn.sh` calls `runworker.sh` in a screen session. The runworker script can modify the paths (since LD_LIBRARY_PATH does not trasfer to inside screen sessions), and calls `driver.py`.

Finally, `driver.py` runs an infinite loop of actually calling the training script, and this is where I set up all the cross-validation ranges. Also note, very importantly, how the `train.lua` script is called, with 

```python
cmd = 'CUDA_VISIBLE_DEVICES=%d th train.lua ' % (gpuid, )
```

this is because otherwise Torch allocates a lot of memory on all GPUs on a single machine because it wants to support multigpu setups, but if you're only training on a single GPU you really want to use this flag to *hide* the other GPUs from each worker.

Also note that I'm using the field `opt.id` to assign a unique identifier to each worker, based on the GPU it's running on and some random number, and current time, to distinguish each run.

Have a look through my `driver.py` to get a sense of what it's doing. In my workflow I keep modifying this script and killing workers whenever I want to tune some of the cross-validation ranges.

### Playing with checkpoints that get written to files

Finally, the IPython Notebook `inspect_cv.ipynb` gives you an idea about how I analyze the checkpoints that get written out by the workers. The notebook is *super-hacky* and not intended for plug and play use; I'm only putting it up in case this is useful to anyone to build on, and to get a sense for the kinds of analysis you might want to play with.

### Conclusion

Overall, this system works quite well for me. My cluster machines run workers in screen sessions, these write checkpoints to a shared file system, and then I use notebooks to look at what hyperparameter ranges work well. Whatever works well I encode into `driver.py`, and then I restart the workers and iterate until things work well :) Hope some of this is useful & Good luck!
```

### Important image/diagram links

- `README.md` → https://raw.github.com/karpathy/neuraltalk2/master/vis/teaser.jpeg

## karpathy/arxiv-sanity-lite (branch: `master`)

### `README.md`

```markdown

# arxiv-sanity-lite

A much lighter-weight arxiv-sanity from-scratch re-write. Periodically polls arxiv API for new papers. Then allows users to tag papers of interest, and recommends new papers for each tag based on SVMs over tfidf features of paper abstracts. Allows one to search, rank, sort, slice and dice these results in a pretty web UI. Lastly, arxiv-sanity-lite can send you daily emails with recommendations of new papers based on your tags. Curate your tags, track recent papers in your area, and don't miss out!

I am running a live version of this code on [arxiv-sanity-lite.com](https://arxiv-sanity-lite.com).

![Screenshot](screenshot.jpg)

#### To run

To run this locally I usually run the following script to update the database with any new papers. I typically schedule this via a periodic cron job:

```bash
#!/bin/bash

python3 arxiv_daemon.py --num 2000

if [ $? -eq 0 ]; then
    echo "New papers detected! Running compute.py"
    python3 compute.py
else
    echo "No new papers were added, skipping feature computation"
fi
```

You can see that updating the database is a matter of first downloading the new papers via the arxiv api using `arxiv_daemon.py`, and then running `compute.py` to compute the tfidf features of the papers. Finally to serve the flask server locally we'd run something like:

```bash
export FLASK_APP=serve.py; flask run
```

All of the database will be stored inside the `data` directory. Finally, if you'd like to run your own instance on the interwebs I recommend simply running the above on a [Linode](https://www.linode.com), e.g. I am running this code currently on the smallest "Nanode 1 GB" instance indexing about 30K papers, which costs $5/month.

(Optional) Finally, if you'd like to send periodic emails to users about new papers, see the `send_emails.py` script. You'll also have to `pip install sendgrid`. I run this script in a daily cron job.

#### Requirements

 Install via requirements:

 ```bash
 pip install -r requirements.txt
 ```

#### Todos

- Make website mobile friendly with media queries in css etc
- The metas table should not be a sqlitedict but a proper sqlite table, for efficiency
- Build a reverse index to support faster search, right now we iterate through the entire database

#### License

MIT
```

### `data/readme.md`

```markdown
This directory stores the database, sequestered away from the code and the main project directory.
E.g. includes the arxiv paper metadata, the calculated tfidf features, and the user tags data.
```

### Important image/diagram links

- `README.md` → https://raw.githubusercontent.com/karpathy/arxiv-sanity-lite/master/screenshot.jpg

## karpathy/ConvNetJS (branch: `master`)

### `Readme.md`

```markdown

# ConvNetJS

ConvNetJS is a Javascript implementation of Neural networks, together with nice browser-based demos. It currently supports:

- Common **Neural Network modules** (fully connected layers, non-linearities)
- Classification (SVM/Softmax) and Regression (L2) **cost functions**
- Ability to specify and train **Convolutional Networks** that process images
- An experimental **Reinforcement Learning** module, based on Deep Q Learning

For much more information, see the main page at [convnetjs.com](http://convnetjs.com)

**Note**: I am not actively maintaining ConvNetJS anymore because I simply don't have time. I think the npm repo might not work at this point.

## Online Demos
- [Convolutional Neural Network on MNIST digits](http://cs.stanford.edu/~karpathy/convnetjs/demo/mnist.html)
- [Convolutional Neural Network on CIFAR-10](http://cs.stanford.edu/~karpathy/convnetjs/demo/cifar10.html)
- [Toy 2D data](http://cs.stanford.edu/~karpathy/convnetjs/demo/classify2d.html)
- [Toy 1D regression](http://cs.stanford.edu/~karpathy/convnetjs/demo/regression.html)
- [Training an Autoencoder on MNIST digits](http://cs.stanford.edu/~karpathy/convnetjs/demo/autoencoder.html)
- [Deep Q Learning Reinforcement Learning demo](http://cs.stanford.edu/people/karpathy/convnetjs/demo/rldemo.html)
- [Image Regression ("Painting")](http://cs.stanford.edu/~karpathy/convnetjs/demo/image_regression.html)
- [Comparison of SGD/Adagrad/Adadelta on MNIST](http://cs.stanford.edu/people/karpathy/convnetjs/demo/trainers.html)

## Example Code

Here's a minimum example of defining a **2-layer neural network** and training
it on a single data point:

```javascript
// species a 2-layer neural network with one hidden layer of 20 neurons
var layer_defs = [];
// input layer declares size of input. here: 2-D data
// ConvNetJS works on 3-Dimensional volumes (sx, sy, depth), but if you're not dealing with images
// then the first two dimensions (sx, sy) will always be kept at size 1
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});
// declare 20 neurons, followed by ReLU (rectified linear unit non-linearity)
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'}); 
// declare the linear classifier on top of the previous hidden layer
layer_defs.push({type:'softmax', num_classes:10});

var net = new convnetjs.Net();
net.makeLayers(layer_defs);

// forward a random data point through the network
var x = new convnetjs.Vol([0.3, -0.5]);
var prob = net.forward(x); 

// prob is a Vol. Vols have a field .w that stores the raw data, and .dw that stores gradients
console.log('probability that x is class 0: ' + prob.w[0]); // prints 0.50101

var trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, l2_decay:0.001});
trainer.train(x, 0); // train the network, specifying that x is class zero

var prob2 = net.forward(x);
console.log('probability that x is class 0: ' + prob2.w[0]);
// now prints 0.50374, slightly higher than previous 0.50101: the networks
// weights have been adjusted by the Trainer to give a higher probability to
// the class we trained the network with (zero)
```

and here is a small **Convolutional Neural Network** if you wish to predict on images:

```javascript
var layer_defs = [];
layer_defs.push({type:'input', out_sx:32, out_sy:32, out_depth:3}); // declare size of input
// output Vol is of size 32x32x3 here
layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
// the layer will perform convolution with 16 kernels, each of size 5x5.
// the input will be padded with 2 pixels on all sides to make the output Vol of the same size
// output Vol will thus be 32x32x16 at this point
layer_defs.push({type:'pool', sx:2, stride:2});
// output Vol is of size 16x16x16 here
layer_defs.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});
// output Vol is of size 16x16x20 here
layer_defs.push({type:'pool', sx:2, stride:2});
// output Vol is of size 8x8x20 here
layer_defs.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});
// output Vol is of size 8x8x20 here
layer_defs.push({type:'pool', sx:2, stride:2});
// output Vol is of size 4x4x20 here
layer_defs.push({type:'softmax', num_classes:10});
// output Vol is of size 1x1x10 here

net = new convnetjs.Net();
net.makeLayers(layer_defs);

// helpful utility for converting images into Vols is included
var x = convnetjs.img_to_vol(document.getElementById('some_image'))
var output_probabilities_vol = net.forward(x)
```

## Getting Started
A [Getting Started](http://cs.stanford.edu/people/karpathy/convnetjs/started.html) tutorial is available on main page.

The full [Documentation](http://cs.stanford.edu/people/karpathy/convnetjs/docs.html) can also be found there.

See the **releases** page for this project to get the minified, compiled library, and a direct link to is also available below for convenience (but please host your own copy)

- [convnet.js](http://cs.stanford.edu/people/karpathy/convnetjs/build/convnet.js)
- [convnet-min.js](http://cs.stanford.edu/people/karpathy/convnetjs/build/convnet-min.js)

## Compiling the library from src/ to build/
If you would like to add features to the library, you will have to change the code in `src/` and then compile the library into the `build/` directory. The compilation script simply concatenates files in `src/` and then minifies the result.

The compilation is done using an ant task: it compiles `build/convnet.js` by concatenating the source files in `src/` and then minifies the result into `build/convnet-min.js`. Make sure you have **ant** installed (on Ubuntu you can simply *sudo apt-get install* it), then cd into `compile/` directory and run:

    $ ant -lib yuicompressor-2.4.8.jar -f build.xml

The output files will be in `build/`
## Use in Node
The library is also available on *node.js*:

1. Install it: `$ npm install convnetjs`
2. Use it: `var convnetjs = require("convnetjs");`

## License
MIT
```


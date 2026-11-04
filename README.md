# CompressPath: how compact prostate-tissue classifiers hold up under compression and resolution loss

Rwanda has about 14 practicing pathologists, roughly 1.1 per million people. The United States has around 60 per million (McHugh, 2020). Hospitals cope with telepathology: rural referral centers send static images for triage (Mpunga et al., 2016), and some sites run live review over videoconferencing (Manirakiza et al., 2023). Those images cross slow networks, so they get compressed and resized before anyone looks at them.

A pathologist can usually work around a blurry image. A classifier trained on clean scans may not, and as far as I could find, nobody had checked. Compact models built for modest hardware are rarely tested under this kind of damage, and I found no comparison of two of them under compression and resolution loss together, with and without training on degraded images.

So I asked the question early, while the choices are still open. What do compression and resolution loss do to compact classifiers, and which model and training approach holds up best? The answer here comes from public data, a controlled comparison of two architectures, and a test bench anyone can use to check their own model the same way.

This is my ALU capstone (BSc Software Engineering, Machine Learning track, supervised by Emmanuel Adjei). It has two parts. The first is the evidence: MobileNetV3-Small and ShuffleNetV2-x1.0, each trained twice on SICAPv2 (once on clean patches, once on a mix of clean and degraded ones), then tested on a dataset none of them had seen, under nine levels of JPEG compression and resolution loss. The second is a small web app where a researcher, a telepathology lab or a pipeline developer picks a model and a transfer condition and sees what degradation does to the prediction and the file size. You can upload your own checkpoint and run it through the same conditions.

The app is live at https://degradation-aware-prostate-grading.vercel.app/, backed by an API on Railway at https://degradation-aware-prostate-grading-production.up.railway.app.

Short version: ShuffleNet trained on degraded images barely notices the damage. The clean-trained models fall apart once resolution drops.

## Why this question

Prostate cancer is the second most commonly diagnosed cancer in men worldwide and the fifth leading cause of cancer death among them (Bray et al., 2024). Men of African descent tend to present with more aggressive disease and die from it at higher rates (Rebbeck et al., 2013). In a study across three referral hospitals in Kigali, 85% of the confirmed cancer patients were already at an advanced stage when diagnosed (Nzeyimana et al., 2021). The cases are there. Diagnosis is what's slow.

Some earlier work has looked at how degraded images affect automated pathology tools:

| Study | What they did | What it left open |
|-------|---------------|-------------------|
| Doyle et al. (2010) | Classical handcrafted-feature classifier on prostate histology. Accuracy fell as JPEG compression increased. | Not deep learning. No resolution loss. |
| Chen et al. (2020) | CNN for nuclei segmentation. Training on JPEG2000-compressed images partly recovered the lost accuracy. | One task, one compression type, no architecture comparison. |
| Ji et al. (2026) | Lung tissue segmentation. MobileNetV3 handled JPEG2000 better than ResNet-18, ResNet-50 and a Transformer. | No resolution loss, no degradation-aware training, no ShuffleNetV2. |

That last paper is why MobileNetV3 is here. ShuffleNetV2 (Ma et al., 2018) is the second model because it was designed around measured inference speed on real devices, not just FLOP counts. It's about the same size as MobileNetV3-Small (around 2.3 million parameters at 1.0x width), so the comparison is fair. Nobody had checked whether the two hold up the same way under compression and downsampling, or whether degradation-aware training helps both of them.

## Why test this early

Gleason grading models are well established. The paper behind SICAPv2 (Silva-Rodriguez et al., 2020) describes one. My question is a different one: does a compact classifier's accuracy survive the compression and downsampling that telepathology forces on images, and does training on degraded data help?

If a model falls apart on a half-resolution patch, it is better to learn that now, with public data and a notebook, than after someone has built a workflow around it.

The degradation here is simulated with JPEG compression and downscaling. It stands in for real network transmission or phone microscopy and is not a validated substitute. Nothing in this repo is a clinical recommendation, and I did not test deployment outcomes, queue times or agreement between pathologists.

## Research questions

1. Does training on a mix of clean and degraded patches improve macro F1 and per-class recall under JPEG compression, resolution loss, and both combined?
2. How much clean-image accuracy does each architecture give up when trained on degraded data?
3. Does the benefit of degradation-aware training differ between MobileNetV3-Small and ShuffleNetV2?
4. Which architecture and training approach is the better candidate to investigate first for a low-bandwidth referral setting?

Answers are in the [results section](#results) below.

## Repository layout

```
degradation-aware-prostate-grading/
  README.md
  app/
    Prostate_Robust_Notebook.ipynb   training and evaluation notebook (Colab)
    backend/                 FastAPI inference server
      main.py                routes: /, /models, /conditions, /infer
      model_utils.py         architecture builders, checkpoint loading, inference
      degradation.py         the nine transmission conditions used by the app
      schemas.py             Pydantic response models
      requirements.txt
      requirements-dev.txt   test dependencies
      tests/                 pytest suite: unit, integration and error-handling tests
      checkpoints/           the four trained .pth files (about 5 to 6 MB each)
    frontend/                React 19 + Vite + Tailwind 4 single page app
      src/App.jsx            state and the one API call
      src/components/        Header, FileDropZone, ModelSelector, ConditionSelector, ResultsPanel
      src/constants.js       API address, model list and transmission conditions
```

The training notebook is `app/Prostate_Robust_Notebook.ipynb`. It runs every experiment in order, and its saved outputs include all the numbers below. To retrain, you'll also need the datasets on Google Drive. More on that below.

## Results

### Clean SICAPv2 validation

Validation used 15 patients who were kept out of training entirely (1,957 patches). I report macro F1 throughout. The classes are imbalanced, so plain accuracy would make the models look better than they are.

Before any degradation training, I ran a six-step ablation on each architecture, changing one thing at a time:

| Exp | Pretrained | Weight decay | Dropout | Class weights | Dense head | MobileNet F1 | ShuffleNet F1 |
|-----|-----------|--------------|---------|---------------|------------|--------------|---------------|
| A | no | | | | | 0.505 | 0.611 |
| B | yes | | | | | 0.657 | **0.732** |
| C | yes | 1e-4 | 0.3 | | | 0.662 | 0.732 |
| D | yes | | | yes | | 0.657 | 0.710 |
| E | yes | 1e-4 | 0.3 | yes | | **0.672** | 0.712 |
| F | yes | 1e-4 | 0.3 | yes | yes | 0.671 | 0.690 |

ImageNet pretraining was the only change that made a real difference. After that, every config landed within a couple of hundredths of the others. With one seed per run, I wouldn't trust that ordering much. I still carried the top scorer forward for each architecture: Exp E for MobileNet and Exp B for ShuffleNet.

I then retrained those two configs with degradation augmentation. On clean SICAPv2 they scored 0.665 (MobileNet, down from 0.672) and 0.737 (ShuffleNet, up from 0.732). That answers question 2: on clean data, the augmentation cost basically nothing.

### Zurich TMA, the real test

The proposal planned to test on a held-out slice of SICAPv2. I went further and also used Zurich TMA (3,055 patches) as a fully external test set. It comes from a different lab, so it brings real differences in staining and scanning. None of it was used for training or model selection.

| Condition | MN-Clean | MN-Deg | SN-Clean | SN-Deg |
|-----------|---------:|-------:|---------:|-------:|
| clean | 0.340 | 0.578 | 0.517 | 0.533 |
| jpeg75 | 0.317 | 0.578 | 0.569 | 0.565 |
| jpeg50 | 0.307 | 0.581 | 0.578 | 0.568 |
| jpeg25 | 0.266 | 0.570 | 0.569 | 0.569 |
| res256 | 0.219 | 0.506 | 0.430 | 0.585 |
| res128 | 0.178 | 0.454 | 0.334 | 0.597 |
| res256_jpeg50 | 0.197 | 0.509 | 0.411 | 0.603 |
| res128_jpeg25 | 0.134 | 0.449 | 0.292 | 0.599 |
| stress_res64_jpeg25 | 0.184 | 0.319 | 0.171 | 0.548 |
| mean | 0.238 | 0.505 | 0.430 | **0.574** |

Here's how the four questions come out.

Question 1, does degradation-aware training help? Yes, for both architectures. Mean macro F1 went from 0.238 to 0.505 for MobileNet and from 0.430 to 0.574 for ShuffleNet. Most of the gain shows up under resolution loss. JPEG compression on its own turned out to be fairly harmless, and SN-Clean handled it fine before collapsing to 0.17 under the stress condition.

Question 2, what does it cost? Almost nothing on clean SICAPv2 (see above). On clean Zurich, the degraded models actually came out ahead.

Question 3, does the benefit differ by architecture? It does, and not in the way I expected. SN-Deg is nearly flat across all nine conditions. It even scores slightly higher under the stress condition (0.548) than on clean Zurich (0.533), and that stress condition was held out of training. MN-Deg improves everywhere, including a big jump on clean Zurich images (0.578 vs 0.340). That suggests the augmentation also made MobileNet less sensitive to the change of dataset. But it still drops to 0.319 under the stress condition. Ji et al. found MobileNetV3 to be the most robust of the backbones they tested, but here ShuffleNetV2 held up better once resolution loss was involved.

Question 4, which one would I take into a pilot first? SN-Deg. It has the best mean and the flattest curve.

Some honest caveats. Every model loses ground just from switching datasets, even before any degradation. Part of that is class mix (Zurich is mostly G3, while SICAPv2 validation is mostly NC and G4). Each model also leans toward one class on Zurich: MN-Clean over-calls G5, SN-Clean over-calls NC, and SN-Deg over-calls G3. Under the stress condition, SN-Deg only finds 16% of G5 patches, though when it does call G5 it's right 86% of the time. None of these models is ready for clinical use, and I'm not claiming they are.

## How training worked

This is a summary. The notebook has the full details.

- Patches are 512x512 from SICAPv2. They're resized to 224x224 for the network and normalized with the usual ImageNet stats.
- The split is at patient level. The 15 validation patient IDs are hardcoded so they can't leak into training.
- Training runs in two phases: 2 warmup epochs on the head only, then up to 20 epochs of full fine-tuning. Early stopping watches val macro F1 (patience 5), and the learning rate halves when progress stalls.
- For degradation training, each sample gets a random condition from the training pool: jpeg75, jpeg50, jpeg25, res256, res128, res256_jpeg50 and res128_jpeg25. `stress_res64_jpeg25` is evaluation only.
- Degradation is applied to the 512px source patch before resizing, so the model sees what a receiver would actually get. Resolution loss means shrinking to N pixels and scaling back up, which leaves the blur you'd expect.
- The seed is fixed at 42, with one run per experiment. That's the biggest weakness of the study. A few seeds per config would make the ablation far more convincing.

One more thing the proposal is careful about, and I want to be too: synthetic JPEG and downscaling stand in for real network transmission or phone microscopy. They aren't a validated substitute. I didn't test anything about deployment, queue times or agreement between pathologists.

The notebook was written for Google Colab and expects this layout on Drive:

```
MyDrive/capstone/
  SICAPv2/
    images/
    wsi_labels.xlsx
    partition/manifest_train.csv
    partition/manifest_val.csv
  zurich_data/
    images/
    manifest.csv
```

Each experiment writes its result to `checkpoints/empirical/results_registry.json`, and later cells read the best config back from there. Run All works from top to bottom without any manual edits.

## Scope versus the proposal

The proposal promised more than I finished. This table shows where each item ended up.

| Planned in the proposal | Status | Notes |
|-------------------------|--------|-------|
| Train MobileNetV3-Small and ShuffleNetV2, clean and degradation-aware | Done | Each architecture uses its own config, picked by a six-step ablation |
| Evaluate under JPEG, downsampling and both combined | Done | Nine conditions, one of them held out of training as a stress test |
| Macro F1 and per-class recall | Done | See Results |
| Independent test set | Done, extended | Zurich TMA, a different lab, used only for testing |
| React and FastAPI MVP: upload an image, pick a model and a transfer condition, see predictions and file sizes | Done | One image at a time |
| Test your own model in the tool | Done | Custom checkpoint upload |
| Upload a labelled batch and export results as CSV | Not done | The app takes one unlabelled image at a time |
| Patient-level uncertainty (entropy), ROC-AUC, sensitivity, specificity, processing time | Not done | The notebook does not compute them |
| Accuracy versus file size trade-off table | Partly done | The app shows file sizes per image. The README results report F1 only |
| TensorFlow and Keras implementation | Changed | PyTorch instead, with timm for MobileNetV3 and torchvision for ShuffleNetV2 |
| `/predict` endpoint for one image | Done, renamed | `POST /infer`. It returns file sizes but not processing time |
| 50 epochs, cosine decay, matched hyperparameters | Changed | Up to 20 epochs after a 2-epoch head warm-up, with early stopping and ReduceLROnPlateau |
| Backend tests | Done | 47 tests pass |

## Running the app

The app is a FastAPI backend with a React frontend. The API runs on Railway and the frontend on Vercel (links at the top). The steps below run both locally.

You'll need Python 3.10 or newer (the backend uses `X | None` type hints) and Node 20 or newer.

### Backend

```bash
cd app/backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app
```

The API runs at http://localhost:8000. All four checkpoints load at startup, so the first request isn't slow. Everything runs on CPU.

### Frontend

```bash
cd app/frontend
npm install
npm run dev
```

Open http://localhost:5173. Without any configuration the frontend calls the deployed API. To use your local backend, create `app/frontend/.env` containing `VITE_API_URL=http://localhost:8000`.

### Running the tests

```bash
cd app/backend
pip install -r requirements-dev.txt
pytest -v
pytest -m "not slow"            # skip tests that run the real checkpoints
```

The suite in `app/backend/tests/` has 47 tests in three files:

| File | Type | What it covers |
|------|------|----------------|
| `test_degradation.py` | Unit | The nine transmission conditions: output shape, lossless baseline, payload size ordering, tiny and grayscale images |
| `test_model_utils.py` | Unit | Model loading and caching, custom checkpoint round trip, rejection of corrupt or mismatched checkpoints, inference output |
| `test_api.py` | Integration, error handling, performance | Every route, all models against the best and worst condition, 400/413/422/500 responses, and a warm-request latency check |

### Using it

The app is a test bench for seeing how degradation changes a model's output. The label it shows is an experimental output, not a diagnosis. There are four labels:

| Label | Meaning |
|-------|---------|
| NC | Non-cancerous tissue |
| G3 | Gleason pattern 3 |
| G4 | Gleason pattern 4 |
| G5 | Gleason pattern 5 |

G3 versus G4 is the hard boundary. Almost every model in this project loses most of its points there.

1. Drop a tissue patch (PNG or JPG, ideally square) onto the upload area.
2. Pick a model. SN-Deg is the default because it did best.
3. Pick a transmission condition.
4. Click Run inference.

You'll see the model's output label, a probability bar for each class, and the original and degraded images side by side with their file sizes. You can upload your own `.pth` checkpoint too. It just has to match the architecture and head shape of the selected model, or loading fails.

## API

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/` | Health check, returns `{"status": "ok"}` |
| GET | `/models` | Lists the model names |
| GET | `/conditions` | Lists the condition IDs |
| POST | `/infer` | Degrades the image, runs the model, returns the result |

`/infer` takes multipart form data:

| Field | Required | Example |
|-------|----------|---------|
| `image` | yes | a PNG or JPG file |
| `model_name` | yes | `SN-Deg` |
| `condition_id` | yes | `res025_jpeg25` |
| `checkpoint` | no | a `.pth` state dict |

Example:

```bash
curl -X POST http://localhost:8000/infer \
  -F image=@patch.png \
  -F model_name=SN-Deg \
  -F condition_id=res025_jpeg25
```

The response includes `predicted_grade`, `top_confidence`, one `probabilities` entry per class (in percent), `model_used`, `condition_used`, `original_size_kb`, `degraded_size_kb` and `degraded_image_b64`, which is the degraded image as a base64 PNG.

### Models

| Name | Architecture | Training | Checkpoint |
|------|--------------|----------|------------|
| MN-Clean | MobileNetV3-Small (timm) | clean, Exp E config | `mobilenet_ExpE_clean.pth` |
| MN-Deg | MobileNetV3-Small (timm) | degraded, Exp E config | `mobilenet_degradation_degradation.pth` |
| SN-Clean | ShuffleNetV2-x1.0 (torchvision) | clean, Exp B config | `shufflenet_ExpB_clean.pth` |
| SN-Deg | ShuffleNetV2-x1.0 (torchvision) | degraded, Exp B config | `shufflenet_degradation_degradation.pth` |

Head shapes have to match the saved weights exactly, so `MODEL_CONFIGS` in `model_utils.py` spells them out per model. MN-Clean was saved with a plain linear head, while MN-Deg has dropout in front of its linear layer. That's why they get separate entries even though both use the Exp E config. If a checkpoint file is missing, the model quietly loads with random weights and gives meaningless predictions. It won't raise an error, so watch for that.

### Transmission conditions in the app

| ID | What happens | Approx. size reduction |
|----|--------------|------------------------|
| `original` | lossless PNG | 0% |
| `jpeg75` | JPEG quality 75 | 62% |
| `res05` | half resolution | 71% |
| `jpeg25` | JPEG quality 25 | 76% |
| `res025` | quarter resolution | 79% |
| `res05_jpeg50` | half resolution, then JPEG 50 | 82% |
| `res025_jpeg50` | quarter resolution, then JPEG 50 | 86% |
| `res025_jpeg25` | quarter resolution, then JPEG 25 | 88% |
| `res025_jpeg10` | quarter resolution, then JPEG 10 | 92% |

These don't map one to one onto the notebook's conditions. The app scales relative to the uploaded image (0.5x and 0.25x) with Lanczos resampling. Training used fixed pixel targets (256, 128 and 64) on 512px patches with bilinear resampling. The app also has a JPEG 10 condition the models never saw. For a 512px patch, `res05` is roughly `res256` and `res025` is roughly `res128`, but the app won't reproduce the tables above exactly.

## Known rough edges

- CORS is open to every origin (`allow_origins=["*"]`). That's fine on your own machine, but lock it down before deploying anywhere.
- Without `VITE_API_URL` set, the frontend calls the deployed Railway API, not a local backend.
- Every number in the results comes from a single seed.
- The checkpoint upload box says `.pt`, but it accepts `.pt` and `.pth`. Either way, it needs a plain state dict.

## Stack

- Backend: FastAPI, Uvicorn, PyTorch, torchvision, timm, Pillow, Pydantic
- Frontend: React 19, Vite, Tailwind CSS 4, lucide-react
- Training: PyTorch on Google Colab, scikit-learn for metrics, pandas, seaborn and matplotlib for plots

## Data

- SICAPv2 (Silva-Rodriguez et al., 2020): prostate biopsy patches with Gleason annotations, released under CC BY 4.0. Used for training and validation.
- Zurich TMA: a prostate tissue microarray set. Used only as an external test set.

Neither dataset is included here. Download them from their original sources and follow their licenses.

## References

- Bray, F., Laversanne, M., Sung, H., Ferlay, J., Siegel, R. L., Soerjomataram, I., & Jemal, A. (2024). Global cancer statistics 2022: GLOBOCAN estimates of incidence and mortality worldwide for 36 cancers in 185 countries. CA: A Cancer Journal for Clinicians, 74(3), 229-263.
- Chen, Y., Janowczyk, A., & Madabhushi, A. (2020). Quantitative assessment of the effects of compression on deep learning in digital pathology image analysis. JCO Clinical Cancer Informatics, 4, 221-233.
- Doyle, S., Monaco, J., Feldman, M., Tomaszewski, J., & Madabhushi, A. (2010). An active learning based classification strategy for the minority class problem: Application to histopathology annotation. IEEE International Symposium on Biomedical Imaging (ISBI).
- Ji, S., Yook, H., Jung, S., & Choi, Y. (2026). Evaluating JPEG2000 compression effects on prediction accuracy and storage efficiency in lung cancer whole-slide images: A deep learning-based analysis. Diagnostic Pathology. https://doi.org/10.1186/s13000-026-01830-7
- Ma, N., Zhang, X., Zheng, H.-T., & Sun, J. (2018). ShuffleNet V2: Practical guidelines for efficient CNN architecture design. Proceedings of the European Conference on Computer Vision (ECCV), 116-131.
- Manirakiza, A., Ngendahayo, L., et al. (2023). The use of VSee videoconferencing for live telepathology in Rwanda: A potential solution for resource-limited areas. Journal of Pathology Informatics.
- McHugh, K. (2020). A trainee abroad: One cytopathology fellow's experience at a teaching hospital in Rwanda. Lablogatory.
- Mpunga, T., Tapela, N., Hedt-Gauthier, B. L., et al. (2016). Implementation and validation of telepathology triage at cancer referral center in rural Rwanda. Journal of Global Oncology, 2(2), 76-82.
- Nzeyimana, F., et al. (2021). Diagnosis of advanced prostate cancer at the community level in Rwanda. International Urology and Nephrology.
- Rebbeck, T. R., Devesa, S. S., Chang, B.-L., et al. (2013). Global patterns of prostate cancer incidence, aggressiveness, and mortality in men of African descent. Prostate Cancer, 2013, Article 560857.
- Silva-Rodriguez, J., Colomer, A., Sales, M. A., Molina, R., & Naranjo, V. (2020). Going deeper through the Gleason scoring scale: An automatic end-to-end system for histology prostate grading and cribriform pattern detection. Computer Methods and Programs in Biomedicine, 195, 105637.

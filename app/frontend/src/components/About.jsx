// Why the project exists, what it found and what the tool is for, in plain words.
export default function About() {
  return (
    <section>
      <h2 className='text-lg font-bold text-[#191C1E] mb-3'>About</h2>
      <div className='flex flex-col gap-3 text-sm text-[#5A5266]'>
        <p>
          Rwanda has about 14 practicing pathologists, roughly 1.1 per million people. Telepathology
          helps, but the images cross slow networks, so they get compressed and shrunk on the way.
          The long-term hope is AI-assisted grading, but a model trained on clean images can fail
          quietly on damaged ones. This project checks that early.
        </p>
        <p>
          Upload a tissue patch, choose one of four trained models and a transfer condition, and
          the tool degrades the patch, classifies it, and shows the Gleason grade, the class
          probabilities and how much smaller the file became. You can also load your own weights
          for MobileNetV3-Small or ShuffleNetV2.
        </p>
        <p>
          In our tests, training on degraded images made both models far more robust, and
          ShuffleNet trained this way held up best (see Findings). The tool is a test bench for
          researchers and developers who build telepathology pipelines, not an assisted-grading
          product.
        </p>
        <p>
          The degradation is simulated, nothing was tested on Rwandan data, and the grade is an
          experimental output, not a diagnosis.
        </p>
      </div>
    </section>
  )
}

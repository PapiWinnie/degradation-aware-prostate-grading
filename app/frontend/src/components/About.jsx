// Purpose of the tool, in plain words.
export default function About() {
  return (
    <section>
      <h2 className='text-lg font-bold text-[#191C1E] mb-3'>About</h2>
      <div className='flex flex-col gap-3 text-sm text-[#5b5e66]'>
        <p>
          Pathology images are often compressed or shrunk before they are sent between labs.
          This tool shows what that does to a small image classifier.
        </p>
        <p>
          Upload a tissue patch, choose one of four trained models and a transfer condition, and
          the tool degrades the patch, classifies it, and shows the Gleason grade, the class
          probabilities and how much smaller the file became. You can also load your own weights
          for MobileNetV3-Small or ShuffleNetV2.
        </p>
        <p>
          It is meant for researchers and developers who build or test telepathology pipelines.
          The grade is an experimental output, not a diagnosis.
        </p>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'

// The privacy policy. Every statement here is about what this site actually does.
// Keep it in step with the backend (app/backend/main.py) if that behaviour changes.
const CONTACT_NAME  = 'Winston Nji'
const CONTACT_EMAIL = 'w.nji1@alustudent.com'
const UPDATED       = '21 November 2026'
const CC_BY_URL     = 'https://creativecommons.org/licenses/by/4.0/'

const SECTIONS = [
  {
    title: 'Who is responsible',
    body: [
      `CompressPath is a student research project (BSc Software Engineering, African Leadership University). ${CONTACT_NAME} is responsible for this website and the service behind it. Questions about this policy or your data can go to ${CONTACT_EMAIL}.`,
      'This policy is written with Rwanda\'s Law No. 058/2021 of 13/10/2021 relating to the protection of personal data and privacy in mind.',
    ],
  },
  {
    title: 'What this tool is, and what it is not',
    body: [
      'CompressPath is a test bench for researchers and developers. It shows what compression and shrinking do to the output of small prostate-tissue classifiers. The grade it shows is an experimental output. It is not a diagnosis, and it must not be used for patient care.',
    ],
  },
  {
    title: 'What data is involved',
    list: [
      'The image you upload, and the model and transfer condition you choose.',
      'If you use the advanced option, the weights file you upload.',
      'Technical details that any website receives when you visit it, such as your IP address, the time of the request and your browser type. These are recorded by our hosting providers (see "Who receives your data").',
    ],
  },
  {
    title: 'Why the data is used',
    body: [
      'Only to do what you ask: apply the compression you chose to your image, run the model you chose on the result, and show you the prediction and the file sizes. It is not used for advertising, profiling or sale, and it is not used to train or improve any model.',
    ],
  },
  {
    title: 'What the site does not do',
    list: [
      'There are no accounts and no login, and no history of what you have run.',
      'The code of this site sets no cookies and includes no analytics or advertising scripts.',
      'The service does not write your image or your weights file to disk or to a database. They are processed in memory to answer your request, and the result is sent back to your browser.',
    ],
  },
  {
    title: 'Please do not upload patient-identifiable images',
    body: [
      'Pathology images and their file names or metadata can identify a person, and health information is sensitive. Upload only images you are entitled to use and that cannot be linked to a patient, for example public research images or the sample patches on this site. If you are unsure whether an image can be linked to a person, do not upload it.',
    ],
  },
  {
    title: 'Who receives your data',
    list: [
      'Vercel serves the website to your browser.',
      'Railway runs the service (the API) that receives your image, applies the compression, runs the model and returns the result.',
    ],
    body: [
      'These providers may keep standard technical logs of requests (for example IP addresses and request details) under their own terms and policies. We do not share your data with anyone else.',
    ],
  },
  {
    title: 'Where it is processed',
    body: [
      'Your image is sent over an encrypted connection to the service hosted on Railway. We have not confirmed the physical location of that server, so your data may be processed outside Rwanda.',
    ],
  },
  {
    title: 'How long data is kept',
    body: [
      'Your image and your weights file are held in memory only while your request is being processed, and the service does not keep them after it has replied. Logs kept by our hosting providers follow their own retention periods, which we do not control.',
    ],
  },
  {
    title: 'Your choice and your rights',
    body: [
      'Using the tool is voluntary. By choosing a file and pressing "Run inference" you ask us to process that file for the purpose above. You can stop at any time by not uploading, or by closing the page.',
      `You have the right to withdraw your consent at any time, and to ask what data we hold about you, to have it corrected, restricted or erased, and to object to its use. Because the service does not store uploads, there is usually nothing to access or erase, but write to ${CONTACT_EMAIL} and we will answer for anything we do hold. You also have the right to complain to the supervisory authority responsible for data protection in Rwanda.`,
    ],
  },
  {
    title: 'Automated processing',
    body: [
      'The grade is produced automatically by a compact neural network (MobileNetV3-Small or ShuffleNetV2) trained on the public SICAPv2 dataset. It is a research output. No decision about you or about any patient is made from it by us. How the models were trained and how they behave under degradation is described on the Findings page.',
    ],
  },
  {
    title: 'Security',
    body: [
      'We take reasonable technical steps: the connection is encrypted, image uploads have a size limit, the service only accepts browser requests that come from this website, and uploaded weights files are loaded in a restricted mode that does not run code. No online service can promise perfect security.',
    ],
  },
  {
    title: 'Children',
    body: [
      'This tool is for researchers and developers. It is not intended for anyone under 16.',
    ],
  },
  {
    title: 'Sample images and credits',
    body: [
      <>
        The sample patches on this site come from the public SICAPv2 dataset (Silva-Rodriguez, J., Colomer, A., Sales,
        M. A., Molina, R., & Naranjo, V., 2020, Computer Methods and Programs in Biomedicine, 195, 105637), released
        under the Creative Commons Attribution 4.0 licence (
        <a href={CC_BY_URL} target='_blank' rel='noopener noreferrer' className='font-semibold text-[#A12F77] hover:underline'>CC BY 4.0</a>
        ). Changes: patches from the dataset were used for model training, and the site shows patches resized or
        recompressed to simulate transmission.
      </>,
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      `If the way the site handles data changes, this page will be updated and this date changed. Last updated: ${UPDATED}.`,
    ],
  },
]

export default function Privacy() {
  return (
    <section className='flex flex-col gap-8 max-w-3xl'>

      <div>
        <h2 className='text-2xl font-bold text-[#191C1E]'>Privacy policy</h2>
        <p className='mt-2 text-sm text-[#5A5266]'>
          The short version: you choose an image, we run it through a model and show you the result. We do not keep it,
          and we do not use it for anything else. Please do not upload anything that identifies a patient.
        </p>
      </div>

      {SECTIONS.map((s) => (
        <div key={s.title} className='bg-white border border-[#F0C9DC] rounded-2xl p-5'>
          <h3 className='text-base font-bold text-[#191C1E]'>{s.title}</h3>
          {s.list && (
            <ul className='mt-2 flex flex-col gap-2 text-sm text-[#5A5266] list-disc pl-5'>
              {s.list.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
          {s.body && s.body.map((p, i) => <p key={i} className='mt-2 text-sm text-[#5A5266]'>{p}</p>)}
        </div>
      ))}

      <p className='text-sm text-[#5A5266]'>
        <Link to='/tool' className='font-semibold text-[#A12F77] hover:underline'>Back to the tool</Link>
      </p>

    </section>
  )
}

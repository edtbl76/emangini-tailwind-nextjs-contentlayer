interface Project {
  title: string,
  description: string,
  href?: string,
  imgSrc?: string,
}

const projectsData: Project[] = [
  {
    title: 'devvocates',
    description: `Devvocates uses open-source software to ensure equal tech 
    education and transparent governance, empowering communities and driving 
    positive societal and environmental impacts.`,
    imgSrc: '/static/images/devvocates.png',
    href: 'https://devvocates.org',
  },
  {
    title: 'A Search Engine',
    description: `What if you could look up any information in the world? Webpages, images, videos
    and more. Google has many features to help you find exactly what you're looking
    for.`,
    imgSrc: '/static/images/google.png',
    href: 'https://www.google.com',
  },
]

export default projectsData

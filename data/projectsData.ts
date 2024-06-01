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
    href: 'https://github.com/devvocates',
  },
]

export default projectsData

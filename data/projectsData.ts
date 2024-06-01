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
    href: 'https://devvocatres.org',
  },
  {
    title: 'microdaddy',
    description: `This is an example of microservices on k8s. The commit history
    shows the journey through different time periods of service orientation. 
    Naming is hard. My son asked me what I was doing. I told him I was writing 
    microservices. He said 'Microdaddy!'`,
    imgSrc: '/static/images/microdaddy.png',
    href: 'https://github.com/edtbl76/microdaddy',
  },
]

export default projectsData

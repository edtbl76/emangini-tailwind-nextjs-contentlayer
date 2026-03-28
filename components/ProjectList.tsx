'use client'

import { useState } from 'react'
import Image from './Image'
import Link from './Link'

interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

function ProjectRow({ title, description, href, imgSrc }: Project) {
  const [open, setOpen] = useState(false)

  return (
    <li className="border-b border-gray-200 last:border-0 dark:border-gray-700">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail panel — hidden until row is opened */}
      {open && (
        <div className="pb-6">
          {imgSrc && (
            <div className="mb-4 overflow-hidden rounded-md">
              <Image
                alt={title}
                src={imgSrc}
                className="object-cover object-center"
                width={544}
                height={306}
              />
            </div>
          )}
          <p className="prose max-w-none text-gray-500 dark:text-gray-400">{description}</p>
          {href && (
            <Link
              href={href}
              className="mt-3 inline-block text-base font-medium leading-6 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
              aria-label={`Link to ${title}`}
            >
              View project &rarr;
            </Link>
          )}
        </div>
      )}
    </li>
  )
}

export default function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {projects.map((project) => (
        <ProjectRow key={project.title} {...project} />
      ))}
    </ul>
  )
}

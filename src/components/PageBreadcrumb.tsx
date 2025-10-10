import Link from 'next/link'
import { BreadcrumbItem } from 'react-bootstrap'
import { TbChevronRight } from 'react-icons/tb'

type PageBreadcrumbProps = {
  title: string
  subtitle?: string
  subtitleLink?: string // <-- new prop
}

const PageBreadcrumb = ({ title, subtitle, subtitleLink }: PageBreadcrumbProps) => {
  return (
    <div className="page-title-head d-flex align-items-center">
      <div className="flex-grow-1">
        <h4 className="fs-xl fw-bold m-0">{title}</h4>
      </div>
      <div className="text-end">
        <div className="breadcrumb m-0 py-0 d-flex align-items-center gap-1">
          <BreadcrumbItem linkAs={Link} href="/mainDeshbord">
            Home
          </BreadcrumbItem>
          <TbChevronRight />
          {subtitle && (
            <>
              <BreadcrumbItem
                linkAs={Link}
                href={subtitleLink ? subtitleLink : "#"} // <-- use the link if provided
              >
                {subtitle}
              </BreadcrumbItem>
              <TbChevronRight />
            </>
          )}
          <BreadcrumbItem active>{title}</BreadcrumbItem>
        </div>
      </div>
    </div>
  )
}

export default PageBreadcrumb

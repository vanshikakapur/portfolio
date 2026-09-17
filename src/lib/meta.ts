import { profile } from '../content/profile'
import { variantBySlug } from '../content/variants'

/** Title and description for a route. The build prerenders these into each
 *  page's HTML and the app applies the same values on client navigation, so a
 *  crawler and a visitor always see one set of strings. */
export function metaFor(pathname: string): { title: string; description: string } {
  const slug = pathname.match(/^\/variants\/([^/]+)/)?.[1]
  const variant = slug ? variantBySlug.get(slug) : undefined

  if (variant) {
    return { title: `${variant.title} — ${profile.name}`, description: variant.blurb }
  }
  if (pathname === '/about' || pathname === '/about/') {
    return { title: `Analyst — ${profile.name}`, description: profile.standfirst }
  }
  if (pathname === '/' || pathname === '') {
    return {
      title: `${profile.name} — ${profile.discipline}`,
      description: profile.metaDescription,
    }
  }
  return {
    title: `Conformance error — ${profile.name}`,
    description: `That path is not in the model. ${profile.standfirst}`,
  }
}

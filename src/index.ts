export { make_html_constructor }

type HTMLAttributeValue
  /** Strings are the "default" data type. They will be set as is */
  = string
  /** HTML attributes have multiple interpretations of what a list means.
  However, the class list of tags, and the `[${attribute}~=${value}]` query selector both agree that lists are space delimited. Therefore, a list will lead to a space delimited list */
  | string[]
  /**
  Boolean attributes in HTML only require existance, but I prefer the
  XML way where the value of the attribute matches the key. A false
  value will omit the attribute in its entirety.
   */
  | boolean


/**
Explicit type overrides for HTML attributes.

The following fields *could* have had a type override, but haven't for
the following reasons:
- `datetime`: Primarily applied to time tags. While the attribute
  format is strict, it is still quite flexible (exact datetime, exact
  date, exact time, a period), meaning that the overrided type would
  be overly complex (for now at least).
 */
type SpecialHTMLAttributes = {
  /**
  Styles are a sub-record. Styles already is a sub record, but
  encoding it manually as a string leads to a number of errors, they
  main ones being a lack of semicolons (`a: something, b: something
  else` is invalid), and the lack of property names (`{ style: '1em'}`
  would be noncense).
   */
  style?: Record<string, string>,

  /**
  This just saves the (library) user from typing the `data-` prefix
  for each attribute. No special processing is done.
   */
  data?: Record<string, HTMLAttributeValue>,

  /**
  Class list for the object. Forced as an array to clarify it won't be
  treated as a plain string. Also handled explicitly in the actuall
  constructor, to fail faster if an invalid argument (e.g. a class
  name containing a space) is present in the list.
   */
  class?: string[],
}

/**
Valid attributes on an HTML tag.

Special attributes are as noted by the `SpecialHTMLAttributes` type.
Unknown attributes MUST satisfy `HTMLAttributeValue`, but have the
wider type of the union of them all, due to limits of typescript.
 */
type HTMLAttributes =
  SpecialHTMLAttributes & {
    [attribute: string]
    : SpecialHTMLAttributes[keyof SpecialHTMLAttributes]
    | HTMLAttributeValue
  }

type HTMLConstructor<T extends HTMLElement> = {
  (attributes: HTMLAttributes, ...children: (string | Node)[]): T
  (...children: (string | Node)[]): T
}

/**
Create a function for creating HTML elements.

@param tag
The HTML tag to create instances of.

@return A function which takes a list of child elements, with an
optional initial argument which will be mapped to the attributes of
the created element. The returned value will be the created element.

Certain attributes of the attributes element have special handling:
- `@raw` makes the function ignore the remaining children, and instead
  apply this data to the element through `el.innerHTML. Use only with
  trusted data.
 */
function make_html_constructor<T extends HTMLElement>(
  tag: string
): HTMLConstructor<T> {
  return (...args: [HTMLAttributes, ...(string | Node)[]] | (string | Node)[]) => {
    const [attributes, children]: [HTMLAttributes, (string | Node)[]]
      = (args.length > 0 && typeof args[0] === 'object' && !(args[0] instanceof Node))
        ? [args[0], args.slice(1)] as [HTMLAttributes, (string | Node)[]]
        : [{}, args as (string | Node)[]]

    const el = document.createElement(tag)

    for (const [key, value] of Object.entries(attributes)) {
      switch (key) {
        case '@raw':
          break

        case 'class':
          /*
          The 'class' case could be omitted, which would default it to
          the 'default' case below. However, making it explicit will
          give proper errors on attempts to set classes with spaces in
          them.
           */
          for (const cls of value as string[]) {
            el.classList.add(cls)
          }
          break

        case 'style':
          for (const [k, v] of Object.entries(value as Record<string, string>)) {
            /*
            Typescript contains mapping for all "well known" css
            attributes, but we need to support arbitrary keys (due to
            custom CSS keys), so we just default to setProperty.

Note that unknown keys in the default namespace (e.g. not prefixed
with "--"), and invalid values for known keys, are treated as noops.
             */
            el.style.setProperty(k, v)
          }
          break

        case 'data':
          for (const [k, v] of Object.entries(value as Record<string, HTMLAttributeValue>)) {
            switch (typeof v) {
              case 'string':
                el.dataset[k] = v
                break
              case 'boolean':
                el.dataset[k] = k
                break
              default:
                if (Array.isArray(v)) {
                  el.dataset[k] = v.join(' ')
                } else {
                  throw new Error
                }
            }
          }
          break

        default:
          switch (typeof value) {
            case 'string':
              el.setAttribute(key, value)
              break
            case 'boolean':
              if (value) {
                el.setAttribute(key, key)
              }
              break
            default:
              if (Array.isArray(value)) {
                el.setAttribute(key, value.join(' '))
              }
              throw new Error
          }
      }
    }

    if ('@raw' in attributes) {
      el.innerHTML = attributes['@raw'] as string
    } else {
      el.replaceChildren(...children)
    }

    return el as T
  }
}

/* Dynamically generating this list would be nice.
While TypeScript does support dynamic exports, it lacks the pretty
import syntax (`import { span } from 'makehtml`), making it a moot
point to implement.

This list is semi-automatically generated by going to
https://html.spec.whatwg.org/multipage/indices.html
and executing

```
rows = document.querySelector('#element-interfaces ~ table').querySelectorAll('tbody tr')
document.write('<!doctype html><pre>')
for (row of rows) {
tag = row.querySelector('td:nth-child(1) code')
if (! tag) continue
interface = row.querySelector('td:nth-child(2) a')
t = tag.textContent
i = interface.textContent
document.write(`export const ${t} = make_html_constructor&lt;${i}&gt;('${t}')\n`)
}
document.write('</pre>')
```
 */
/** Creates an `a` element, @see {@link make_html_constructor}. */
export const a = make_html_constructor<HTMLAnchorElement>('a')
/** Creates an `abbr` element, @see {@link make_html_constructor}. */
export const abbr = make_html_constructor<HTMLElement>('abbr')
/** Creates an `address` element, @see {@link make_html_constructor}. */
export const address = make_html_constructor<HTMLElement>('address')
/** Creates an `area` element, @see {@link make_html_constructor}. */
export const area = make_html_constructor<HTMLAreaElement>('area')
/** Creates an `article` element, @see {@link make_html_constructor}. */
export const article = make_html_constructor<HTMLElement>('article')
/** Creates an `aside` element, @see {@link make_html_constructor}. */
export const aside = make_html_constructor<HTMLElement>('aside')
/** Creates an `audio` element, @see {@link make_html_constructor}. */
export const audio = make_html_constructor<HTMLAudioElement>('audio')
/** Creates a `b` element, @see {@link make_html_constructor}. */
export const b = make_html_constructor<HTMLElement>('b')
/** Creates a `base` element, @see {@link make_html_constructor}. */
export const base = make_html_constructor<HTMLBaseElement>('base')
/** Creates a `bdi` element, @see {@link make_html_constructor}. */
export const bdi = make_html_constructor<HTMLElement>('bdi')
/** Creates a `bdo` element, @see {@link make_html_constructor}. */
export const bdo = make_html_constructor<HTMLElement>('bdo')
/** Creates a `blockquote` element, @see {@link make_html_constructor}. */
export const blockquote = make_html_constructor<HTMLQuoteElement>('blockquote')
/** Creates a `body` element, @see {@link make_html_constructor}. */
export const body = make_html_constructor<HTMLBodyElement>('body')
/** Creates a `br` element, @see {@link make_html_constructor}. */
export const br = make_html_constructor<HTMLBRElement>('br')
/** Creates a `button` element, @see {@link make_html_constructor}. */
export const button = make_html_constructor<HTMLButtonElement>('button')
/** Creates a `canvas` element, @see {@link make_html_constructor}. */
export const canvas = make_html_constructor<HTMLCanvasElement>('canvas')
/** Creates a `caption` element, @see {@link make_html_constructor}. */
export const caption = make_html_constructor<HTMLTableCaptionElement>('caption')
/** Creates a `cite` element, @see {@link make_html_constructor}. */
export const cite = make_html_constructor<HTMLElement>('cite')
/** Creates a `code` element, @see {@link make_html_constructor}. */
export const code = make_html_constructor<HTMLElement>('code')
/** Creates a `col` element, @see {@link make_html_constructor}. */
export const col = make_html_constructor<HTMLTableColElement>('col')
/** Creates a `colgroup` element, @see {@link make_html_constructor}. */
export const colgroup = make_html_constructor<HTMLTableColElement>('colgroup')
/** Creates a `data` element, @see {@link make_html_constructor}. */
export const data = make_html_constructor<HTMLDataElement>('data')
/** Creates a `datalist` element, @see {@link make_html_constructor}. */
export const datalist = make_html_constructor<HTMLDataListElement>('datalist')
/** Creates a `dd` element, @see {@link make_html_constructor}. */
export const dd = make_html_constructor<HTMLElement>('dd')
/** Creates a `del` element, @see {@link make_html_constructor}. */
export const del = make_html_constructor<HTMLModElement>('del')
/** Creates a `details` element, @see {@link make_html_constructor}. */
export const details = make_html_constructor<HTMLDetailsElement>('details')
/** Creates a `dfn` element, @see {@link make_html_constructor}. */
export const dfn = make_html_constructor<HTMLElement>('dfn')
/** Creates a `dialog` element, @see {@link make_html_constructor}. */
export const dialog = make_html_constructor<HTMLDialogElement>('dialog')
/** Creates a `div` element, @see {@link make_html_constructor}. */
export const div = make_html_constructor<HTMLDivElement>('div')
/** Creates a `dl` element, @see {@link make_html_constructor}. */
export const dl = make_html_constructor<HTMLDListElement>('dl')
/** Creates a `dt` element, @see {@link make_html_constructor}. */
export const dt = make_html_constructor<HTMLElement>('dt')
/** Creates an `em` element, @see {@link make_html_constructor}. */
export const em = make_html_constructor<HTMLElement>('em')
/** Creates an `embed` element, @see {@link make_html_constructor}. */
export const embed = make_html_constructor<HTMLEmbedElement>('embed')
/** Creates a `fieldset` element, @see {@link make_html_constructor}. */
export const fieldset = make_html_constructor<HTMLFieldSetElement>('fieldset')
/** Creates a `figcaption` element, @see {@link make_html_constructor}. */
export const figcaption = make_html_constructor<HTMLElement>('figcaption')
/** Creates a `figure` element, @see {@link make_html_constructor}. */
export const figure = make_html_constructor<HTMLElement>('figure')
/** Creates a `footer` element, @see {@link make_html_constructor}. */
export const footer = make_html_constructor<HTMLElement>('footer')
/** Creates a `form` element, @see {@link make_html_constructor}. */
export const form = make_html_constructor<HTMLFormElement>('form')
/** Creates a `h1` element, @see {@link make_html_constructor}. */
export const h1 = make_html_constructor<HTMLHeadingElement>('h1')
/** Creates a `h2` element, @see {@link make_html_constructor}. */
export const h2 = make_html_constructor<HTMLHeadingElement>('h2')
/** Creates a `h3` element, @see {@link make_html_constructor}. */
export const h3 = make_html_constructor<HTMLHeadingElement>('h3')
/** Creates a `h4` element, @see {@link make_html_constructor}. */
export const h4 = make_html_constructor<HTMLHeadingElement>('h4')
/** Creates a `h5` element, @see {@link make_html_constructor}. */
export const h5 = make_html_constructor<HTMLHeadingElement>('h5')
/** Creates a `h6` element, @see {@link make_html_constructor}. */
export const h6 = make_html_constructor<HTMLHeadingElement>('h6')
/** Creates a `head` element, @see {@link make_html_constructor}. */
export const head = make_html_constructor<HTMLHeadElement>('head')
/** Creates a `header` element, @see {@link make_html_constructor}. */
export const header = make_html_constructor<HTMLElement>('header')
/** Creates a `hgroup` element, @see {@link make_html_constructor}. */
export const hgroup = make_html_constructor<HTMLElement>('hgroup')
/** Creates a `hr` element, @see {@link make_html_constructor}. */
export const hr = make_html_constructor<HTMLHRElement>('hr')
/** Creates a `html` element, @see {@link make_html_constructor}. */
export const html = make_html_constructor<HTMLHtmlElement>('html')
/** Creates a `i` element, @see {@link make_html_constructor}. */
export const i = make_html_constructor<HTMLElement>('i')
/** Creates a `iframe` element, @see {@link make_html_constructor}. */
export const iframe = make_html_constructor<HTMLIFrameElement>('iframe')
/** Creates a `img` element, @see {@link make_html_constructor}. */
export const img = make_html_constructor<HTMLImageElement>('img')
/** Creates a `input` element, @see {@link make_html_constructor}. */
export const input = make_html_constructor<HTMLInputElement>('input')
/** Creates a `ins` element, @see {@link make_html_constructor}. */
export const ins = make_html_constructor<HTMLModElement>('ins')
/** Creates a `kbd` element, @see {@link make_html_constructor}. */
export const kbd = make_html_constructor<HTMLElement>('kbd')
/** Creates a `label` element, @see {@link make_html_constructor}. */
export const label = make_html_constructor<HTMLLabelElement>('label')
/** Creates a `legend` element, @see {@link make_html_constructor}. */
export const legend = make_html_constructor<HTMLLegendElement>('legend')
/** Creates a `li` element, @see {@link make_html_constructor}. */
export const li = make_html_constructor<HTMLLIElement>('li')
/** Creates a `link` element, @see {@link make_html_constructor}. */
export const link = make_html_constructor<HTMLLinkElement>('link')
/** Creates a `main` element, @see {@link make_html_constructor}. */
export const main = make_html_constructor<HTMLElement>('main')
/** Creates a `map` element, @see {@link make_html_constructor}. */
export const map = make_html_constructor<HTMLMapElement>('map')
/** Creates a `mark` element, @see {@link make_html_constructor}. */
export const mark = make_html_constructor<HTMLElement>('mark')
/** Creates a `menu` element, @see {@link make_html_constructor}. */
export const menu = make_html_constructor<HTMLMenuElement>('menu')
/** Creates a `meta` element, @see {@link make_html_constructor}. */
export const meta = make_html_constructor<HTMLMetaElement>('meta')
/** Creates a `meter` element, @see {@link make_html_constructor}. */
export const meter = make_html_constructor<HTMLMeterElement>('meter')
/** Creates a `nav` element, @see {@link make_html_constructor}. */
export const nav = make_html_constructor<HTMLElement>('nav')
/** Creates a `noscript` element, @see {@link make_html_constructor}. */
export const noscript = make_html_constructor<HTMLElement>('noscript')
/** Creates an `object` element, @see {@link make_html_constructor}. */
export const object = make_html_constructor<HTMLObjectElement>('object')
/** Creates an `ol` element, @see {@link make_html_constructor}. */
export const ol = make_html_constructor<HTMLOListElement>('ol')
/** Creates an `optgroup` element, @see {@link make_html_constructor}. */
export const optgroup = make_html_constructor<HTMLOptGroupElement>('optgroup')
/** Creates an `option` element, @see {@link make_html_constructor}. */
export const option = make_html_constructor<HTMLOptionElement>('option')
/** Creates an `output` element, @see {@link make_html_constructor}. */
export const output = make_html_constructor<HTMLOutputElement>('output')
/** Creates a `p` element, @see {@link make_html_constructor}. */
export const p = make_html_constructor<HTMLParagraphElement>('p')
/** Creates a `picture` element, @see {@link make_html_constructor}. */
export const picture = make_html_constructor<HTMLPictureElement>('picture')
/** Creates a `pre` element, @see {@link make_html_constructor}. */
export const pre = make_html_constructor<HTMLPreElement>('pre')
/** Creates a `progress` element, @see {@link make_html_constructor}. */
export const progress = make_html_constructor<HTMLProgressElement>('progress')
/** Creates a `q` element, @see {@link make_html_constructor}. */
export const q = make_html_constructor<HTMLQuoteElement>('q')
/** Creates a `rp` element, @see {@link make_html_constructor}. */
export const rp = make_html_constructor<HTMLElement>('rp')
/** Creates a `rt` element, @see {@link make_html_constructor}. */
export const rt = make_html_constructor<HTMLElement>('rt')
/** Creates a `ruby` element, @see {@link make_html_constructor}. */
export const ruby = make_html_constructor<HTMLElement>('ruby')
/** Creates a `s` element, @see {@link make_html_constructor}. */
export const s = make_html_constructor<HTMLElement>('s')
/** Creates a `samp` element, @see {@link make_html_constructor}. */
export const samp = make_html_constructor<HTMLElement>('samp')
/** Creates a `search` element, @see {@link make_html_constructor}. */
export const search = make_html_constructor<HTMLElement>('search')
/** Creates a `script` element, @see {@link make_html_constructor}. */
export const script = make_html_constructor<HTMLScriptElement>('script')
/** Creates a `section` element, @see {@link make_html_constructor}. */
export const section = make_html_constructor<HTMLElement>('section')
/** Creates a `select` element, @see {@link make_html_constructor}. */
export const select = make_html_constructor<HTMLSelectElement>('select')
/** Creates a `slot` element, @see {@link make_html_constructor}. */
export const slot = make_html_constructor<HTMLSlotElement>('slot')
/** Creates a `small` element, @see {@link make_html_constructor}. */
export const small = make_html_constructor<HTMLElement>('small')
/** Creates a `source` element, @see {@link make_html_constructor}. */
export const source = make_html_constructor<HTMLSourceElement>('source')
/** Creates a `span` element, @see {@link make_html_constructor}. */
export const span = make_html_constructor<HTMLSpanElement>('span')
/** Creates a `strong` element, @see {@link make_html_constructor}. */
export const strong = make_html_constructor<HTMLElement>('strong')
/** Creates a `style` element, @see {@link make_html_constructor}. */
export const style = make_html_constructor<HTMLStyleElement>('style')
/** Creates a `sub` element, @see {@link make_html_constructor}. */
export const sub = make_html_constructor<HTMLElement>('sub')
/** Creates a `summary` element, @see {@link make_html_constructor}. */
export const summary = make_html_constructor<HTMLElement>('summary')
/** Creates a `sup` element, @see {@link make_html_constructor}. */
export const sup = make_html_constructor<HTMLElement>('sup')
/** Creates a `table` element, @see {@link make_html_constructor}. */
export const table = make_html_constructor<HTMLTableElement>('table')
/** Creates a `tbody` element, @see {@link make_html_constructor}. */
export const tbody = make_html_constructor<HTMLTableSectionElement>('tbody')
/** Creates a `td` element, @see {@link make_html_constructor}. */
export const td = make_html_constructor<HTMLTableCellElement>('td')
/** Creates a `template` element, @see {@link make_html_constructor}. */
export const template = make_html_constructor<HTMLTemplateElement>('template')
/** Creates a `textarea` element, @see {@link make_html_constructor}. */
export const textarea = make_html_constructor<HTMLTextAreaElement>('textarea')
/** Creates a `tfoot` element, @see {@link make_html_constructor}. */
export const tfoot = make_html_constructor<HTMLTableSectionElement>('tfoot')
/** Creates a `th` element, @see {@link make_html_constructor}. */
export const th = make_html_constructor<HTMLTableCellElement>('th')
/** Creates a `thead` element, @see {@link make_html_constructor}. */
export const thead = make_html_constructor<HTMLTableSectionElement>('thead')
/** Creates a `time` element, @see {@link make_html_constructor}. */
export const time = make_html_constructor<HTMLTimeElement>('time')
/** Creates a `title` element, @see {@link make_html_constructor}. */
export const title = make_html_constructor<HTMLTitleElement>('title')
/** Creates a `tr` element, @see {@link make_html_constructor}. */
export const tr = make_html_constructor<HTMLTableRowElement>('tr')
/** Creates a `track` element, @see {@link make_html_constructor}. */
export const track = make_html_constructor<HTMLTrackElement>('track')
/** Creates an `u` element, @see {@link make_html_constructor}. */
export const u = make_html_constructor<HTMLElement>('u')
/** Creates an `ul` element, @see {@link make_html_constructor}. */
export const ul = make_html_constructor<HTMLUListElement>('ul')
/** Creates a `video` element, @see {@link make_html_constructor}. */
export const video = make_html_constructor<HTMLVideoElement>('video')
/** Creates a `wbr` element, @see {@link make_html_constructor}. */
export const wbr = make_html_constructor<HTMLElement>('wbr')

// manually removed
// export const var = make_html_constructor<HTMLElement>('var')

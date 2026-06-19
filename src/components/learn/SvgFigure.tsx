import React, { useMemo } from 'react';
import type { QuestionDiagram } from '../../lib/content';

/**
 * Sanitize model-generated SVG before rendering. Diagrams come from our own
 * Claude pipeline, but we still defence-in-depth against script injection:
 * drop dangerous elements, event handlers, and any external/href references.
 */
const DISALLOWED_TAGS = new Set([
  'script', 'foreignobject', 'iframe', 'image', 'use', 'a',
  'animate', 'animatetransform', 'animatemotion', 'set', 'style', 'link',
]);

function sanitizeSvg(raw: string): string | null {
  if (!raw || raw.length > 40_000) return null;
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return null;
  try {
    const docu = new DOMParser().parseFromString(raw, 'image/svg+xml');
    if (docu.querySelector('parsererror')) return null;
    const svg = docu.querySelector('svg');
    if (!svg) return null;

    const clean = (el: Element) => {
      Array.from(el.children).forEach(child => {
        if (DISALLOWED_TAGS.has(child.tagName.toLowerCase())) {
          child.remove();
          return;
        }
        Array.from(child.attributes).forEach(attr => {
          const name = attr.name.toLowerCase();
          const value = attr.value.toLowerCase();
          if (name.startsWith('on') || name === 'href' || name === 'xlink:href' || value.includes('javascript:')) {
            child.removeAttribute(attr.name);
          }
        });
        clean(child);
      });
    };

    Array.from(svg.attributes).forEach(attr => {
      if (attr.name.toLowerCase().startsWith('on')) svg.removeAttribute(attr.name);
    });
    clean(svg);

    // Let CSS control size; keep the aspect ratio from viewBox.
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    return svg.outerHTML;
  } catch {
    return null;
  }
}

const SvgFigure: React.FC<{ diagram?: QuestionDiagram | null; className?: string }> = ({ diagram, className }) => {
  const html = useMemo(
    () => (diagram && diagram.kind === 'svg' ? sanitizeSvg(diagram.svg) : null),
    [diagram],
  );
  if (!html) return null;
  return (
    <figure className={`ln-figure ${className ?? ''}`.trim()} role="img" aria-label={diagram?.alt || 'Diagram'}>
      <div className="ln-figure-svg" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
};

export default SvgFigure;

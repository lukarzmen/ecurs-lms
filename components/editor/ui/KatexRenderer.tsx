/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import katex from 'katex';
import * as React from 'react';
import {useEffect, useRef} from 'react';

export default function KatexRenderer({
  equation,
  inline,
  onDoubleClick,
}: Readonly<{
  equation: string;
  inline: boolean;
  onDoubleClick: () => void;
}>): JSX.Element {
  const katexElementRef = useRef(null);

  useEffect(() => {
    const katexElement = katexElementRef.current;

    if (katexElement !== null) {
      katex.render(equation, katexElement, {
        displayMode: !inline, // true === block display //
        errorColor: '#cc0000',
        output: 'html',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      });
    }
  }, [equation, inline]);

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    // We use an empty image tag either side to ensure Android doesn't try and compose from the
    // inner text from Katex. There didn't seem to be any other way of making this work,
    // without having a physical space.
    <>
      <img src="#" alt="" style={{display: 'none'}} />
      <span
        role="button"
        tabIndex={-1}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={katexElementRef}
        style={{
          display: inline ? 'inline-block' : 'block',
          padding: inline ? '4px 8px' : '12px 16px',
          margin: inline ? '0 2px' : '8px 0',
          backgroundColor: isHovered ? 'hsl(210, 40%, 98%)' : 'hsl(210, 40%, 96.1%)',
          border: '1px solid hsl(214.3, 31.8%, 91.4%)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isHovered 
            ? '0 4px 8px rgba(0, 0, 0, 0.08), 0 0 0 2px hsl(222.2, 47.4%, 11.2%, 0.1)' 
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        }}
      />
      <img src="#" alt="" style={{display: 'none'}} />
    </>
  );
}

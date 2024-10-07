/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
interface Theme {
  code: string;
  heading: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
  };
  image: string;
  link: string;
  list: {
    listitem: string;
    nested: {
      listitem: string;
    };
    ol: string;
    ul: string;
  };
  ltr: string;
  paragraph: string;
  placeholder: string;
  quote: string;
  rtl: string;
  text: {
    bold: string;
    code: string;
    hashtag: string;
    italic: string;
    overflowed: string;
    strikethrough: string;
    underline: string;
    underlineStrikethrough: string;
  };
  };
  


const theme: Theme = {
    code: 'editor-code',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
      h4: 'editor-heading-h4',
      h5: 'editor-heading-h5',
    },
    image: 'editor-image',
    link: 'editor-link',
    list: {
      listitem: 'editor-listitem',
      nested: {
        listitem: 'editor-nested-listitem',
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
    },
    ltr: 'ltr',
    paragraph: 'editor-paragraph',
    placeholder: 'editor-placeholder',
    quote: 'editor-quote',
    rtl: 'rtl',
    text: {
      bold: 'editor-text-bold',
      code: 'editor-text-code',
      hashtag: 'editor-text-hashtag',
      italic: 'editor-text-italic',
      overflowed: 'editor-text-overflowed',
      strikethrough: 'editor-text-strikethrough',
      underline: 'editor-text-underline',
      underlineStrikethrough: 'editor-text-underlineStrikethrough',
    },
  };
export default theme;
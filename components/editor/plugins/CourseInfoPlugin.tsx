/**
 * Example plugin demonstrating how to use course and module context in lexical plugins
 */

import { useCourseContext } from '../context/CourseContext';

export default function CourseInfoPlugin(): JSX.Element | null {
  const { module } = useCourseContext();

  // This is just a demonstration - you can access module data
  // in any plugin and use them for various purposes like:
  // - Analytics tracking
  // - Contextual help
  // - Custom content generation
  // - API calls that need course/module identification
  // - Custom UI elements

  // For development/debugging purposes only - remove in production
  if (process.env.NODE_ENV === 'development' && module) {
    console.log('Course Context Available:', module);
  }

  // This plugin doesn't render anything visible, but the context is available
  // for any plugin that needs course and module information
  return null;
}

export { useCourseContext };
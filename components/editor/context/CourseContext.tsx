import React, { createContext, useContext } from 'react';

export interface ModuleContextData {
  courseId?: string;
  courseName?: string;
  moduleId?: string;
  moduleName?: string;
}

interface CourseContextType {
  module?: ModuleContextData;
}

const CourseContext = createContext<CourseContextType>({});

/**
 * Hook to access course and module information in lexical plugins
 * 
 * Example usage in a plugin:
 * 
 * import { useCourseContext } from '../context/CourseContext';
 * 
 * export default function MyPlugin() {
 *   const { module } = useCourseContext();
 *   
 *   // Now you can use module data in your plugin logic
 *   console.log(`Current course: ${module?.courseName}, Module: ${module?.moduleName}, Module ID: ${module?.moduleId}`);
 *   
 *   return (
 *     <div>
 *       {module?.courseName && <span>Course: {module.courseName}</span>}
 *       {module?.moduleName && <span>Module: {module.moduleName}</span>}
 *       {module?.moduleId && <span>Module ID: {module.moduleId}</span>}
 *     </div>
 *   );
 * }
 */
export const useCourseContext = () => {
  return useContext(CourseContext);
};

export const CourseProvider: React.FC<{
  children: React.ReactNode;
  module?: ModuleContextData;
}> = ({ children, module }) => {
  const value: CourseContextType = {
    module,
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};
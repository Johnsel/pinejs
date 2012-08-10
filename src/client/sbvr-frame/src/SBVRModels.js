// Generated by CoffeeScript 1.3.3
(function() {

  window.model1 = 'Term:      pilot\nTerm:      plane\nFact type: pilot can fly plane\nFact type: pilot is experienced\nRule:      It is obligatory that each pilot can fly at least 1 plane\nRule:      It is obligatory that each pilot that is experienced can fly at least 3 planes';

  window.model2 = 'Term:      student\nTerm:      course\nTerm:      study programme\nFact type: student is registered for course\nFact type: student is enrolled in study programme\nFact type: course is available for study programme \nRule:      It is obligatory that each student is registered for at most 5 course\n\nRule:      It is obligatory that each student that is registered for a course is enrolled in a study programme that the course is available for\n\nFact type: student is under probation\nRule:      It is obligatory that each student that is under probation is registered for at most 3 courses\n\nTerm:      lecturer\nTerm:      grade\nFact type: student is marked with grade by lecturer for course\nRule:      It is obligatory that each student is marked with a grade by a lecturer for each course that the student is registered for';

  window.model3 = 'Term:      student\nFact type: student is school president\nRule:      It is obligatory that a student is school president\nTerm:      module\nFact type: student is registered for module\nRule:      It is obligatory that each student is registered for at most 5 modules\nTerm:      study programme\nFact type: student is enrolled in study programme\nFact type: module is available for study programme\nRule:      It is obligatory that each student that is registered for a module is enrolled in a study programme that the module is available for\nTerm:      lecturer\nFact type: student is under probation\nRule:      It is obligatory that each student is registered for at most 5 modules\nRule:      It is obligatory that each student that is under probation is registered for at most 3 modules\nRule:      It is obligatory that at most 10 students are under probation\nFact type: lecturer grades student for study programme with grade\nRule:      It is prohibited that a student that is under probation is enrolled in more than 2 study programmes\nRule:      It is obligatory that each student is registered for each module';

}).call(this);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/workspace/training/page.tsx";
const trainingPath = "src/lib/training.ts";
const cssPath = "src/app/workspace/training/training-home.css";
const certificateActionsPath = "src/components/training-certificate-actions.tsx";
const recommendationsPath = "src/lib/training-recommendations.ts";

test("training home resumes the learner at the exact next lesson or assessment", async () => {
  const [page, training] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(trainingPath, "utf8"),
  ]);

  assert.match(page, /Continue where you left off/);
  assert.match(page, /resumeCourse\.nextLesson/);
  assert.match(page, /lessons\/\$\{course\.nextLesson\.id\}/);
  assert.match(page, /resumeCourse\.nextAssessment/);
  assert.match(page, /assessments\/\$\{course\.nextAssessment\.id\}/);

  assert.match(training, /select\("lesson_id,completed_at"\)/);
  assert.match(training, /nextLesson:/);
  assert.match(training, /nextAssessment:/);
  assert.match(training, /lastActivityAt/);
});

test("training home recommends a sequenced path from the VA primary specialty", async () => {
  const [page, training, recommendations] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(trainingPath, "utf8"),
    readFile(recommendationsPath, "utf8"),
  ]);

  assert.match(page, /learnerProfile\?\.primaryCategory/);
  assert.match(page, /getSpecialtyTrainingPath\(specialty\)/);
  assert.match(recommendations, /"Executive Assistance"/);
  assert.match(recommendations, /virtual-assistant-foundations/);
  assert.match(recommendations, /executive-virtual-assistant/);
  assert.match(recommendations, /project-management-for-virtual-assistants/);
  assert.match(page, /completedRecommended/);
  assert.match(page, /Next in your path/);

  assert.match(training, /from\("va_profiles"\)/);
  assert.match(training, /primary_category,categories,tools,industries/);
});

test("course discovery keeps one standalone library, leaves Australia in paths, and stays collapsed by default", async () => {
  const page = await readFile(pagePath, "utf8");

  for (const label of ["All", "Foundation", "Role", "Software", "Industry"]) {
    assert.ok(page.includes(`"${label}"`), "Missing training filter: " + label);
  }

  assert.doesNotMatch(page, /\["australia", "Australia"\]/);
  assert.match(page, /const notStarted = courses\.filter/);
  assert.match(page, /standaloneNotStarted/);
  assert.match(page, /filteredNotStarted/);
  assert.match(page, /course\.country_focus !== "Australia"/);
  assert.match(page, /libraryOpen/);
  assert.match(page, /params\.browse === "1"/);
  assert.match(page, /Browse courses/);
  assert.match(page, /Hide library/);
  assert.match(page, /Australian courses stay in the specialisation paths above/);
  assert.doesNotMatch(page, /generalCourses|pathCourseIds|australiaCourseIds/);
});

test("brand-new learners get one clear Foundations start before path detail", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /isNewLearner = active\.length === 0 && completed\.length === 0/);
  assert.match(page, /foundationsCourse/);
  assert.match(page, /Start here/);
  assert.match(page, /Start VA Foundations/);
  assert.match(page, /training_foundations_start/);
  assert.match(page, /recommendedCourses\.length && !isNewLearner/);
  assert.match(page, /!isNewLearner \? \(/);
});

test("course cards show learning metadata, assessment state, progress, and one action area", async () => {
  const [page, training] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(trainingPath, "utf8"),
  ]);

  assert.match(page, /course\.lessonCount/);
  assert.match(page, /duration\(course\.estimated_minutes\)/);
  assert.match(page, /assessmentLabel\(course\)/);
  assert.match(page, /course\.progressPercent/);
  assert.match(page, /training-course-card-action/);

  assert.match(training, /training_assessments/);
  assert.match(training, /assessmentStatus/);
  assert.match(training, /"in_review"/);
  assert.match(training, /"needs_revision"/);
  assert.match(training, /"passed"/);
});

test("every course card gets a visible icon and color tone with a fallback", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /function courseVisual\(course: TrainingCourseSummary\)/);
  assert.match(page, /const CourseIcon = visual\.icon/);
  assert.match(page, /training-course-icon/);
  assert.match(page, /tone-\$\{visual\.tone\}/);
  assert.match(page, /return \{ tone: "slate", icon: BookOpenCheck \}/);

  for (const tone of ["violet", "blue", "cyan", "teal", "emerald", "amber", "orange", "rose", "pink", "sky", "slate"]) {
    assert.match(css, new RegExp(`training-course-card\\.tone-${tone}`));
  }
});

test("Australian specialisation icons use distinct restrained color treatments", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /specialization-icon-\$\{specialization\.slug\}/);
  assert.match(css, /specialization-icon-tradie-operations/);
  assert.match(css, /specialization-icon-property-management/);
  assert.match(css, /specialization-icon-ndis-allied-health/);
  assert.match(css, /specialization-icon-mortgage-broking/);
});

test("Australian specialisations use real learner states rather than availability chains", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /"Completed"/);
  assert.match(page, /"In progress"/);
  assert.match(page, /"Not started"/);
  assert.match(page, /"Start path"/);
  assert.match(page, /"Continue path"/);
  assert.match(page, /startSignals/);
  assert.doesNotMatch(page, /\/\{steps\.length\} available/);
  assert.doesNotMatch(page, />Available</);
  assert.doesNotMatch(page, /In development/);
});

test("certificates expose completion date, credential verification, and copy or share", async () => {
  const [page, actions] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(certificateActionsPath, "utf8"),
  ]);

  assert.match(page, /credential\.issued_at/);
  assert.match(page, /credential\.credential_code/);
  assert.match(page, /Verify credential/);
  assert.match(page, /TrainingCertificateActions/);
  assert.match(page, /\/training\/certificates\/\$\{credential\.credential_code\}/);

  assert.match(actions, /navigator\.share/);
  assert.match(actions, /navigator\.clipboard\.writeText/);
  assert.match(actions, /Copy \/ share link/);
});

test("active, recently completed, and not-started learning are separated", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Active learning/);
  assert.match(page, /Recently completed/);
  assert.match(page, /Not started/);
  assert.match(page, /completed\.slice\(0, 4\)/);
});

test("training home has a dedicated compact mobile layout for 375 and 390 pixel screens", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /\.training-resume-card/);
  assert.match(css, /\.training-course-grid/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /\.training-certificate-actions/);
  assert.match(css, /\.training-filter-tabs/);
});


test("training home makes the last lesson and ready final check explicit", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /1 lesson left/);
  assert.match(page, /One lesson left:/);
  assert.match(page, /Lessons complete · final check ready/);
  assert.match(page, /Your final check is ready now/);
  assert.match(page, /Finish last lesson/);
  assert.match(page, /Start final check/);
  assert.match(page, /course\.nextAssessment \? "training_assessment_open" : "training_course_continue"/);
  assert.match(page, /resumeCourse\.nextAssessment \? "training_assessment_open" : "training_resume_next"/);
});


test("course and Australian path metadata use consistent colored pills", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /training-course-meta-item is-lessons/);
  assert.match(page, /training-course-meta-item is-duration/);
  assert.match(page, /assessmentMetaClass\(course\)/);
  assert.match(page, /training-specialization-meta-item is-courses/);
  assert.match(page, /training-specialization-meta-item is-duration/);
  assert.match(page, /training-specialization-meta-item is-status/);
  assert.match(css, /training-course-meta-item\.is-lessons/);
  assert.match(css, /training-course-meta-item\.is-duration/);
  assert.match(css, /training-course-meta-item\.is-final\.is-pending/);
  assert.match(css, /training-specialization-meta-item\.is-courses/);
  assert.match(css, /training-specialization-meta-item\.is-status/);
});

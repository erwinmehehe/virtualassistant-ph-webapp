type LessonBlock = Record<string, unknown>;

type AssessmentQualityInput = {
  is_published?: boolean | null;
  assessment_type?: string | null;
  instructions?: string | null;
  pass_score?: number | null;
  rubric?: unknown;
  resource_pack?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function blockType(block: unknown) {
  return isObject(block) ? String(block.type || "") : "";
}

function nonEmptyString(value: unknown, minLength: number) {
  return typeof value === "string" && value.trim().length >= minLength;
}

export function getTrainingPracticalBlockCounts(content: unknown) {
  if (!Array.isArray(content)) {
    return { exercise: 0, template: 0, checklist: 0 };
  }

  return content.reduce(
    (counts, block) => {
      const type = blockType(block);
      if (type === "exercise") counts.exercise += 1;
      if (type === "template") counts.template += 1;
      if (type === "checklist") counts.checklist += 1;
      return counts;
    },
    { exercise: 0, template: 0, checklist: 0 },
  );
}

export function hasCompleteTrainingPracticalLesson(content: unknown) {
  if (!Array.isArray(content) || content.length < 3) return false;

  const counts = getTrainingPracticalBlockCounts(content);
  if (counts.exercise !== 1 || counts.template !== 1 || counts.checklist !== 1) {
    return false;
  }

  const exercise = content.find((block) => blockType(block) === "exercise") as LessonBlock | undefined;
  const template = content.find((block) => blockType(block) === "template") as LessonBlock | undefined;
  const checklist = content.find((block) => blockType(block) === "checklist") as LessonBlock | undefined;

  if (!exercise || !nonEmptyString(exercise.text, 20) || !nonEmptyString(exercise.deliverable, 20)) {
    return false;
  }
  if (!template || !nonEmptyString(template.text, 20)) {
    return false;
  }

  const items = checklist?.items;
  if (!Array.isArray(items) || items.length < 3) return false;
  if (items.some((item) => !nonEmptyString(item, 5))) return false;

  return true;
}

function rubricWeightsTotal100(rubric: unknown) {
  if (!Array.isArray(rubric) || rubric.length < 4) return false;
  const total = rubric.reduce((sum, item) => {
    if (!isObject(item)) return sum;
    const weight = Number(item.weight || 0);
    return sum + (Number.isFinite(weight) ? weight : 0);
  }, 0);
  return total === 100;
}

export function isTrainingAssessmentPublishReady(assessment: AssessmentQualityInput) {
  if (!assessment.is_published) return false;
  if (!nonEmptyString(assessment.instructions, 100)) return false;
  if (assessment.pass_score === null || assessment.pass_score === undefined) return false;

  if (assessment.assessment_type === "practical") {
    if (!rubricWeightsTotal100(assessment.rubric)) return false;
    if (!Array.isArray(assessment.resource_pack) || assessment.resource_pack.length < 2) return false;
  }

  return true;
}

export function isTrainingPracticalAssessmentReady(assessment: AssessmentQualityInput) {
  return assessment.assessment_type === "practical" && isTrainingAssessmentPublishReady(assessment);
}

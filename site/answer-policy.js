/* Shared rules for generated drafts; confirmed facts still use the local knowledge engine. */
(() => {
  const sensitive=/citizen|sponsor|authoriz|authoris|passport|\bdegree\b|certif|clearance|conflict of interest|government.{0,80}(oversight|conflict)|worked (?:directly )?for.{0,40}government|employed.{0,40}government|government.{0,40}employment|drug|criminal|felon|disabil|gender|veteran|\brace\b|ethnic|residen|address|postal|zip code|salary history|licen[cs]e|consent|agree|signature|attest|\bage\b|date of birth|security number|previously applied|worked.{0,30}(here|company|employer)/i;
  const restricted=field=>sensitive.test((field.question||field.label||'')+' '+(field.context||''))||/how (many|much|long).{0,50}(years|months)|years of|years.*experience/i.test(field.question||field.label||'');
  globalThis.ApplicantAnswerPolicy=Object.freeze({sensitive,restricted});
})();

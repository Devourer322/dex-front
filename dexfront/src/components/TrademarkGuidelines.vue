<template>
  <div class="trademark-guidelines">
    <div class="guidelines-container">
      <div class="guidelines-header">
        <h1 class="page-title">Trademark Guidelines</h1>
        <p class="approval-date">FINAL/APPROVED - May 14, 2025</p>
      </div>

      <div class="guidelines-content">
        <div class="intro-section">
          <p class="intro-text">
            DApp respects trademarks and takes steps to ensure that others' trademark rights are respected by creators using DApp.
          </p>
          
          <p class="definition-text">
            For clarity: a trademark is a word, slogan, symbol or design that is used to distinguish one person's or company's products or services from another's. The owner of a trademark may stop others from using the mark or confusingly similar marks.
          </p>
          
          <p class="purpose-text">
            DApp's trademark guidelines are intended to avoid confusion about who provides, is affiliated with or otherwise endorses a creator's token, livestream, comments, or any other content. Please note that these guidelines apply only to the website accessible from the "DApp" or "swap.DApp" urls. These guidelines do not apply information which is stored on a blockchain, or any website that we do not control. To that end, our trademark guidelines are straightforward:
          </p>
        </div>

        <div class="guidelines-section">
          <h2 class="section-title">Guidelines</h2>
          
          <div class="guidelines-list">
            <div class="guideline-item dont">
              <h3 class="guideline-title">Don't:</h3>
              <ul class="guideline-points">
                <li>Use trademarks that do not belong to you without explicit permission.</li>
                <li>Use someone else's trademark in a way that is intended to or may cause legitimate confusion about whether you own a mark.</li>
                <li>Obtain explicit permission before using someone's trademark and before publishing any content suggesting that a trademark owner is an affiliate, sponsor, partner, or otherwise endorses you or your content.</li>
              </ul>
            </div>

            <div class="guideline-item do">
              <h3 class="guideline-title">You may:</h3>
              <ul class="guideline-points">
                <li>reference someone else's trademark in passing (e.g., "I love [trademark]")</li>
                <li>create parodies, commentary, or fan content, but you must (1) be clear that your content is such a parody, commentary, or fan content and is not affiliated with the trademark, and (2) include some caveat in the title of your content to distinguish it (e.g., "[trademark] fan," "[trademark] parody," "[trademark] commentary").</li>
              </ul>
            </div>
          </div>

          <div class="important-note">
            <p>Have a great time making fun of, enjoying, and praising others—but do not pretend you are them in a way that would confuse an ordinary person.</p>
            <p>DApp does not adjudicate allegations of trademark infringement. Any dispute is solely between the trademark owner and the relevant creator(s).</p>
          </div>
        </div>

        <div class="reporting-section">
          <h2 class="section-title">Reporting Trademark Infringement</h2>
          
          <p class="section-intro">
            If you believe a creator on DApp is violating your trademark, please send an email to <a href="mailto:legal@DApp" class="email-link">legal@DApp</a> that includes the following:
          </p>

          <div class="requirements-list">
            <div class="requirement-item">
              <h4 class="requirement-title">Your contact information:</h4>
              <p>name, physical address, telephone number, and email address. You must include a statement that you are either the trademark owner or have the authority to act on behalf of the trademark owner.</p>
            </div>

            <div class="requirement-item">
              <h4 class="requirement-title">Identification of the trademark:</h4>
              <p>a clear description of the trademark you claim has been violated, including the registration and/or application number, where the trademark is registered, and where you use the trademark. You must also identify any goods or services used in connection with the trademark.</p>
            </div>

            <div class="requirement-item">
              <h4 class="requirement-title">Identification of the creator:</h4>
              <p>information reasonably sufficient for our team to locate and identify the creator (e.g., token name, username, URL of livestream).</p>
            </div>
          </div>

          <p class="notification-note">
            Where possible and appropriate, DApp will notify the impacted creator of the claimed trademark violation.
          </p>
        </div>

        <div class="response-section">
          <h2 class="section-title">Response to Trademark Infringement Reports</h2>
          
          <p class="section-intro">When DApp receives a trademark infringement report, DApp will:</p>

          <ol class="response-steps">
            <li>Assess the report to determine if it's legitimate and all information was provided;</li>
            <li>Evaluate the report against these guidelines, DApp's content moderation policy, and any other relevant policy;</li>
            <li>If we determine, in our sole discretion, that content on our website violates the trademark rights of another, we will remove that content from our website.</li>
            <li>If we take action, we may notify the creator about the report where possible;</li>
            <li>DApp allows the creator to submit a response, which may be done by sending an email to <a href="mailto:legal@DApp" class="email-link">legal@DApp</a>, but DApp does not adjudicate disputes; and</li>
            <li>The trademark owner may seek to resolve any and all violations directly with the creator.</li>
          </ol>

          <div class="creator-response">
            <p class="response-intro">
              If you (the creator) are alerted to a violation and do not believe that one has occurred, you should submit the following information to <a href="mailto:legal@DApp" class="email-link">legal@DApp</a> in response:
            </p>

            <ul class="response-requirements">
              <li>Your contact information: name, physical address, telephone number, and email address.</li>
              <li>Information showing you have permission to use the trademark OR information clearly demonstrating any use was parody, commentary, and/or fan-related.</li>
            </ul>
          </div>
        </div>

        <div class="violations-section">
          <h2 class="section-title">Repeat Violations</h2>
          <p>DApp may terminate a creator's access if DApp determines that the creator is a repeat and intentional trademark violator.</p>
        </div>

        <div class="updates-section">
          <h2 class="section-title">Policy Updates</h2>
          <p>DApp reserves the right to update or revise this policy at any time. Continued use of our services constitutes acceptance of any revisions.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No reactive data needed for this static content page
</script>

<style scoped>
.trademark-guidelines {
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
}

.guidelines-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px;
}

.guidelines-header {
  margin-bottom: 40px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  text-transform: lowercase;
}

.approval-date {
  font-size: 14px;
  color: #42b883;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.guidelines-content {
  line-height: 1.7;
}

.intro-section {
  margin-bottom: 40px;
}

.intro-text,
.definition-text,
.purpose-text {
  font-size: 16px;
  color: #e5e7eb;
  margin-bottom: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
  text-transform: lowercase;
}

.guidelines-section {
  margin-bottom: 40px;
}

.guidelines-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.guideline-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid transparent;
}

.guideline-item.dont {
  border-left-color: #ef4444;
}

.guideline-item.do {
  border-left-color: #42b883;
}

.guideline-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
}

.guideline-points {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guideline-points li {
  font-size: 15px;
  color: #d1d5db;
  margin-bottom: 12px;
  padding-left: 20px;
  position: relative;
}

.guideline-points li:before {
  content: "•";
  color: #42b883;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.guideline-item.dont .guideline-points li:before {
  color: #ef4444;
}

.important-note {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.important-note p {
  font-size: 15px;
  color: #fbbf24;
  margin-bottom: 12px;
}

.important-note p:last-child {
  margin-bottom: 0;
}

.reporting-section,
.response-section,
.violations-section,
.updates-section {
  margin-bottom: 40px;
}

.section-intro {
  font-size: 16px;
  color: #e5e7eb;
  margin-bottom: 24px;
}

.email-link {
  color: #42b883;
  text-decoration: none;
  font-weight: 500;
}

.email-link:hover {
  text-decoration: underline;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.requirement-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 16px;
}

.requirement-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.requirement-item p {
  font-size: 15px;
  color: #d1d5db;
  margin: 0;
}

.notification-note {
  font-size: 15px;
  color: #9ca3af;
  font-style: italic;
}

.response-steps {
  list-style: decimal;
  padding-left: 20px;
  margin-bottom: 32px;
}

.response-steps li {
  font-size: 15px;
  color: #d1d5db;
  margin-bottom: 12px;
  line-height: 1.6;
}

.creator-response {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
}

.response-intro {
  font-size: 15px;
  color: #e5e7eb;
  margin-bottom: 16px;
}

.response-requirements {
  list-style: none;
  padding: 0;
  margin: 0;
}

.response-requirements li {
  font-size: 15px;
  color: #d1d5db;
  margin-bottom: 12px;
  padding-left: 20px;
  position: relative;
}

.response-requirements li:before {
  content: "•";
  color: #42b883;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.violations-section p,
.updates-section p {
  font-size: 16px;
  color: #e5e7eb;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .trademark-guidelines {
    padding: 30px;
  }
  
  .guidelines-container {
    padding: 32px;
  }
  
  .page-title {
    font-size: 32px;
  }
  
  .section-title {
    font-size: 22px;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .trademark-guidelines {
    padding: 20px 16px;
  }
  
  .guidelines-container {
    padding: 24px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .approval-date {
    font-size: 13px;
  }
  
  .section-title {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .intro-text,
  .definition-text,
  .purpose-text,
  .section-intro {
    font-size: 15px;
  }
  
  .guideline-item {
    padding: 20px;
  }
  
  .guideline-title {
    font-size: 16px;
  }
  
  .guideline-points li,
  .response-steps li,
  .response-requirements li {
    font-size: 14px;
  }
  
  .requirement-item {
    padding: 14px;
  }
  
  .requirement-title {
    font-size: 15px;
  }
  
  .creator-response {
    padding: 20px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .trademark-guidelines {
    padding: 16px 12px;
  }
  
  .guidelines-container {
    padding: 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .approval-date {
    font-size: 12px;
  }
  
  .section-title {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .intro-text,
  .definition-text,
  .purpose-text,
  .section-intro {
    font-size: 14px;
  }
  
  .guideline-item {
    padding: 16px;
  }
  
  .guideline-title {
    font-size: 15px;
  }
  
  .guideline-points li,
  .response-steps li,
  .response-requirements li {
    font-size: 13px;
  }
  
  .requirement-item {
    padding: 12px;
  }
  
  .requirement-title {
    font-size: 14px;
  }
  
  .creator-response {
    padding: 16px;
  }
  
  .important-note {
    padding: 16px;
  }
  
  .important-note p {
    font-size: 14px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .guidelines-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .guideline-item {
    padding: 14px;
  }
  
  .creator-response {
    padding: 14px;
  }
}
</style>
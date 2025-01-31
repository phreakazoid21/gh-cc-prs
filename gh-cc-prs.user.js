// ==UserScript==
// @name         Github PR CC Label Button
// @namespace    https://alexbardasu.com
// @version      1.1.0
// @description  Adds a button to add CC labels to PR comments (https://conventionalcomments.org)
// @author       @phreakazoid21
// @match        https://github.com/*/*/pull/*
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @resource   CUSTOM_CSS https://raw.githubusercontent.com/phreakazoid21/gh-cc-prs/refs/heads/main/resources/style.css
// @updateURL    https://raw.githubusercontent.com/phreakazoid21/gh-cc-prs/main/gh-cc-prs.user.js
// @downloadURL  https://raw.githubusercontent.com/phreakazoid21/gh-cc-prs/main/gh-cc-prs.user.js
// @supportURL   https://github.com/phreakazoid21/gh-cc-prs/issues
// ==/UserScript==

(function() {
    'use strict';
    const my_css = GM_getResourceText("CUSTOM_CSS");
    GM_addStyle(my_css);

    // Wait for the comment box to load
    const commentBoxObserver = new MutationObserver(() => {
        const commentBox = document.getElementById('new_comment_field');
        if (commentBox) {
            commentBoxObserver.disconnect();
            addCcButton(commentBox);
        }
    });
    commentBoxObserver.observe(document.body, { childList: true, subtree: true });

    // Wait for inline comment boxes to load
    const inlineCommentBoxObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const inlineCommentBoxes = document.querySelectorAll('.inline-comment-form-box textarea');
                inlineCommentBoxes.forEach(inlineCommentBox => {
                    if (!inlineCommentBox.hasAttribute('cc-button-added')) {
                        addCcButton(inlineCommentBox);
                        inlineCommentBox.setAttribute('cc-button-added', 'true');
                    }
                });
            }
        }
    });
    inlineCommentBoxObserver.observe(document.body, { childList: true, subtree: true });

    function preventEventDefault(e) {
        e.preventDefault();
    }

    function addCcButton(commentBox) {
        // Create the CC button
        const ccButton = document.createElement('button');
        ccButton.classList.add('cc-button');

        // Create the dropdown menu
        const dropdown = document.createElement('ul');
        dropdown.style.display = 'none';
        dropdown.style.position = 'absolute';
        dropdown.style.listStyle = 'none';
        dropdown.style.padding = '0';
        dropdown.style.margin = '0';
        dropdown.style.maxWidth = '60%';
        dropdown.style.maxHeight = '20em';
        dropdown.style.overflowY = 'scroll';
        // Style the dropdown menu
        dropdown.style.backgroundColor = 'white'; // Match the background color
        dropdown.style.border = '1px solid lightgray'; // Match the border style
        dropdown.style.boxShadow = '0px 2px 5px rgba(0, 0, 0, 0.15)'; // Add a subtle shadow
        dropdown.style.zIndex = '1000'; // Ensure it's on top of other elements

        // Add labels to the dropdown
        const conventionalCommitTypes = [
            { label: 'praise', description: 'Praises highlight something positive. Try to leave at least one of these comments per review. Do not leave false praise (which can actually be damaging). Do look for something to sincerely praise.' },
            { label: 'nitpick', description: 'Nitpicks are trivial preference-based requests. These should be non-blocking by nature.' },
            { label: 'suggestion', description: 'Suggestions propose improvements to the current subject. It’s important to be explicit and clear on what is being suggested and why it is an improvement. Consider using patches and the blocking or non-blocking decorations to further communicate your intent.' },
            { label: 'issue', description: 'Issues highlight specific problems with the subject under review. These problems can be user-facing or behind the scenes. It is strongly recommended to pair this comment with a suggestion. If you are not sure if a problem exists or not, consider leaving a question.' },
            { label: 'todo', description: 'TODO’s are small, trivial, but necessary changes. Distinguishing todo comments from issues: or suggestions: helps direct the reader’s attention to comments requiring more involvement.' },
            { label: 'question', description: 'Questions are appropriate if you have a potential concern but are not quite sure if it’s relevant or not. Asking the author for clarification or investigation can lead to a quick resolution.' },
            { label: 'thought', description: 'Thoughts represent an idea that popped up from reviewing. These comments are non-blocking by nature, but they are extremely valuable and can lead to more focused initiatives and mentoring opportunities.' },
            { label: 'chore', description: 'Chores are simple tasks that must be done before the subject can be “officially” accepted. Usually, these comments reference some common process. Try to leave a link to the process description so that the reader knows how to resolve the chore.' },
            { label: 'note', description: 'Notes are always non-blocking and simply highlight something the reader should take note of.' },
            { label: 'typo', description: 'Typo comments are like todo:, where the main issue is a misspelling.' },
            { label: 'polish', description: 'Polish comments are like a suggestion, where there is nothing necessarily wrong with the relevant content, there’s just some ways to immediately improve the quality.' },
            { label: 'quibble', description: 'Quibbles are very much like nitpick:, except it does not conjure up images of lice and animal hygiene practices.' }
        ];
        conventionalCommitTypes.forEach(type => {
            const li = document.createElement('li');
            const labelSpan = document.createElement('span');
            labelSpan.className = 'cc-label';
            labelSpan.textContent = type.label;
            labelSpan.style.fontWeight = "bold";
            labelSpan.style.minWidth = "20%";
            labelSpan.style.maxWidth = "25%";
            const descriptionSpan = document.createElement('span');
            descriptionSpan.className = 'cc-label-description';
            descriptionSpan.textContent = type.description;
            descriptionSpan.style.fontStyle = "italic";
            descriptionSpan.style.color = "#999";
            li.appendChild(labelSpan);
            li.appendChild(descriptionSpan);
            li.style.padding = '5px';
            li.style.cursor = 'pointer';
            li.style.display = 'flex';
            li.style.alignItems = 'flex-start'; // Align items to the start
            li.style.borderBottom = '1px rgba(0,0,0,0.3) inset';
            li.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent event from bubbling up
                insertLabel(commentBox, type.label);
                dropdown.style.display = 'none';
                const commentForm = commentBox.closest('form');
                enableCommentButton(commentForm);
            });
            li.addEventListener('mouseover', (event) => {
                li.style.backgroundColor = 'rgba(0,0,0,0.2)';
            });
            li.addEventListener('mouseout', (event) => {
                li.style.backgroundColor = 'unset';
            });
            dropdown.appendChild(li);
        });

        // Add the CC button and dropdown to the comment box
        commentBox.parentNode.insertBefore(ccButton, commentBox.nextSibling);
        commentBox.parentNode.insertBefore(dropdown, ccButton.nextSibling);

        // Show/hide the dropdown when the CC button is clicked
        ccButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const commentForm = commentBox.closest('form');
            const commentButton = commentForm.querySelector('button[type="submit"]');
            if (dropdown.style.display === 'none') {
                // Prevent comment form from submitting
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
                enableCommentButton(commentForm);
            }
        });
    }

    function insertLabel(commentBox, label) {
        const cursorPosition = commentBox.selectionStart;
        const currentContent = commentBox.value;
        const labelText = `**${label}:** `;
        commentBox.value = currentContent.slice(0, cursorPosition) + labelText + currentContent.slice(cursorPosition);
        commentBox.selectionStart = commentBox.selectionEnd = cursorPosition + labelText.length;
        commentBox.focus();
    }

    function enableCommentButton(form) {
        const button = form.querySelector('button[type="submit"]');// Select the button by type
        if (button) {
            button.removeAttribute('disabled');
        }
    }
})();
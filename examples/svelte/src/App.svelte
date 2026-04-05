<script lang="ts">
  import { createJitForm } from '@jitforms/svelte';

  const form = createJitForm({
    baseUrl: 'https://jitforms.test',
    formHash: 'Jve1ZElW',
    honeypot: true,
  });

  let name = $state('');
  let email = $state('');
  let message = $state('');

  async function onSubmit(e: Event) {
    e.preventDefault();
    await $form.submit({ name, email, message });
  }
</script>

{#if $form.isSuccess}
  <div class="success">✓ Submitted successfully.</div>
  <pre style="font-size:0.75rem;overflow:auto">{JSON.stringify($form.submission, null, 2)}</pre>
  <button onclick={() => $form.reset()}>Submit again</button>
{:else}
  <form onsubmit={onSubmit}>
    {#if $form.isError}
      <div class="fail">Something went wrong.</div>
    {/if}
    <div>
      <label for="name">Name</label>
      <input id="name" bind:value={name} />
      {#if $form.fieldError('name')}<div class="error">{$form.fieldError('name')}</div>{/if}
    </div>
    <div>
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} />
      {#if $form.fieldError('email')}<div class="error">{$form.fieldError('email')}</div>{/if}
    </div>
    <div>
      <label for="message">Message</label>
      <textarea id="message" bind:value={message}></textarea>
      {#if $form.fieldError('message')}<div class="error">{$form.fieldError('message')}</div>{/if}
    </div>
    <button type="submit" disabled={$form.isLoading}>
      {$form.isLoading ? 'Sending…' : 'Send'}
    </button>
  </form>
{/if}

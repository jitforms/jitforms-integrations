<script setup lang="ts">
import { reactive } from 'vue';
import { useJitForm } from '@jitforms/vue';

const { submit, isLoading, isSuccess, isError, fieldError, submission, reset } = useJitForm('Jve1ZElW', {
  baseUrl: 'https://jitforms.test',
  honeypot: true,
});

const form = reactive({ name: '', email: '', message: '' });

async function onSubmit(e: Event) {
  e.preventDefault();
  await submit({ ...form });
}
</script>

<template>
  <template v-if="isSuccess">
    <div class="success">✓ Submitted successfully.</div>
    <pre style="font-size:0.75rem;overflow:auto">{{ JSON.stringify(submission, null, 2) }}</pre>
    <button @click="reset">Submit again</button>
  </template>
  <form v-else @submit="onSubmit">
    <div v-if="isError" class="fail">Something went wrong.</div>
    <div>
      <label for="name">Name</label>
      <input id="name" v-model="form.name" />
      <div v-if="fieldError('name')" class="error">{{ fieldError('name') }}</div>
    </div>
    <div>
      <label for="email">Email</label>
      <input id="email" v-model="form.email" type="email" />
      <div v-if="fieldError('email')" class="error">{{ fieldError('email') }}</div>
    </div>
    <div>
      <label for="message">Message</label>
      <textarea id="message" v-model="form.message"></textarea>
      <div v-if="fieldError('message')" class="error">{{ fieldError('message') }}</div>
    </div>
    <button type="submit" :disabled="isLoading">{{ isLoading ? 'Sending…' : 'Send' }}</button>
  </form>
</template>

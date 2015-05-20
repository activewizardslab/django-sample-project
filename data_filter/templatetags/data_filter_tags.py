from django import template

from data_app import models

register = template.Library()


@register.inclusion_tag('data_filter/filter.html', takes_context=True)
def data_filter(context):
    jobs = models.Job.objects.all()
    context['job_ids'] = [j.id for j in jobs]
    context['job_numbers'] = [j.id for j in jobs]

    # questions = models.Question.objects.filter(parent=jobs[0].id)
    context['questions_ids'] = []
    context['question_names'] = []
    return context